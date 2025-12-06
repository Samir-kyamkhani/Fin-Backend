import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/database.connection.js';
import { PermissionService } from '../permission-registry/permission.service.js';
import { RefreshTokenDto } from '../dto/refresh-token-auth.dto.js';
import { ForgotPasswordDto } from '../dto/forgot-password-auth.dto.js';
import { ConfirmPasswordResetDto } from '../dto/confirm-password-reset-auth.dto.js';
import { UpdateCredentialsDto } from '../dto/update-credentials-auth.dto.js';
import { UpdateProfileDto } from '../dto/update-profile-auth.dto.js';
import { TokenPair, AuthActor } from '../interface/auth.interface.js';
import { AuthUtilsService } from '../helper/auth-utils.js';
import { randomBytes } from 'node:crypto';
import { LoginDto } from '../dto/login-auth.dto.js';
import type { Request } from 'express';
import { EmailService } from '../email/email.service.js';
import { AuditStatus } from '../../common/audit-log/enums/audit-log.enum.js';
import { S3Service } from '../../utils/s3/s3.service.js';
import { IpWhitelistService } from '../../common/ip-whitelist/service/ip-whitelist.service.js';
import { FileDeleteHelper } from '../../utils/helper/file-delete-helper.service.js';

@Injectable()
export class RootAuthService {
  private readonly logger = new Logger(RootAuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly authUtils: AuthUtilsService,
    private readonly permissionService: PermissionService,
    private readonly emailService: EmailService,
    private readonly s3: S3Service,
    private readonly ipWhitelistService: IpWhitelistService,
  ) {}

  async login(dto: LoginDto, req: Request) {
    const root = await this.prisma.root.findFirst({
      where: {
        OR: [{ email: dto.email }],
      },
      include: {
        role: {
          select: {
            name: true,
            hierarchyLevel: true,
            createdByType: true,
          },
        },
      },
    });

    const clientIp = this.authUtils.getClientIp(req);
    const clientOrigin = this.authUtils.getClientOrigin(req);
    const userAgent = this.authUtils.getClientUserAgent(req);

    if (!root || root.deletedAt || root.status !== 'ACTIVE') {
      await this.authUtils.createAuthAuditLog({
        performerType: 'ROOT',
        performerId: root?.id ?? null,
        action: 'LOGIN_FAILED',
        status: AuditStatus.FAILED,
        ipAddress: clientIp,
        userAgent,
        metadata: {
          reason: 'USER_NOT_FOUND_OR_INACTIVE',
          email: dto.email,
          clientOrigin,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Password verify (throws UnauthorizedException if invalid)
    try {
      this.authUtils.verifyPassword(dto.password, root.password);
    } catch (err) {
      await this.authUtils.createAuthAuditLog({
        performerType: 'ROOT',
        performerId: root.id,
        action: 'LOGIN_FAILED',
        status: AuditStatus.FAILED,
        ipAddress: clientIp,
        userAgent,
        metadata: {
          reason: 'INVALID_PASSWORD',
          email: dto.email,
          clientOrigin,
        },
      });
      throw err;
    }

    // Whitelist entries for this Root
    const whitelist = await this.ipWhitelistService.findRootWhitelist(root.id);

    const allowedDomains = whitelist
      .map((w) => w.domainName)
      .filter((d): d is string => !!d);
    const allowedIps = whitelist
      .map((w) => w.serverIp)
      .filter((ip): ip is string => !!ip);

    // Origin validation
    if (!this.authUtils.isValidOriginForRoot(clientOrigin, allowedDomains)) {
      await this.authUtils.createAuthAuditLog({
        performerType: 'ROOT',
        performerId: root.id,
        action: 'LOGIN_FAILED',
        status: AuditStatus.FAILED,
        ipAddress: clientIp,
        userAgent,
        metadata: {
          reason: 'ORIGIN_NOT_WHITELISTED_FOR_ROOT',
          clientOrigin,
          allowedDomains,
        },
      });
      throw new ForbiddenException(
        'Access denied: Origin not whitelisted for Root access',
      );
    }

    // IP validation
    if (!this.authUtils.isValidIpForRoot(clientIp, allowedIps)) {
      await this.authUtils.createAuthAuditLog({
        performerType: 'ROOT',
        performerId: root.id,
        action: 'LOGIN_FAILED',
        status: AuditStatus.FAILED,
        ipAddress: clientIp,
        userAgent,
        metadata: {
          reason: 'IP_NOT_WHITELISTED_FOR_ROOT',
          clientIp,
          allowedIps,
        },
      });
      throw new ForbiddenException(
        'Access denied: IP address not whitelisted for Root access',
      );
    }

    // Build actor + tokens
    const actor: AuthActor = this.authUtils.createActor({
      id: root.id,
      principalType: 'ROOT',
      roleId: root.roleId,
      isRoot: true,
    });

    const tokens: TokenPair = this.authUtils.generateTokens(actor);

    await this.prisma.root.update({
      where: { id: root.id },
      data: {
        refreshToken: tokens.refreshToken,
        lastLoginAt: new Date(),
        lastLoginIp: clientIp,
        lastLoginOrigin: clientOrigin,
      },
    });

    const permissions =
      await this.permissionService.getEffectivePermissions(actor);

    const safeRoot = this.authUtils.stripSensitive(root, [
      'password',
      'refreshToken',
      'passwordResetToken',
    ]);

    await this.authUtils.createAuthAuditLog({
      performerType: 'ROOT',
      performerId: root.id,
      action: 'LOGIN_SUCCESS',
      status: AuditStatus.SUCCESS,
      ipAddress: clientIp,
      userAgent,
      metadata: {
        origin: clientOrigin,
        hasWhitelist: whitelist.length > 0,
        allowedDomains,
      },
    });

    return {
      user: safeRoot,
      actor,
      tokens,
      permissions,
    };
  }

  async logout(rootId: string, req: Request) {
    await this.prisma.root.update({
      where: { id: rootId },
      data: { refreshToken: null },
    });

    const userAgent = this.authUtils.getClientUserAgent(req);

    await this.authUtils.createAuthAuditLog({
      performerType: 'ROOT',
      performerId: rootId,
      action: 'LOGOUT',
      status: AuditStatus.SUCCESS,
      ipAddress: req ? this.authUtils.getClientIp(req) : null,
      userAgent: userAgent,
    });

    return { message: 'Logged out successfully' };
  }

  async refreshToken(dto: RefreshTokenDto, req: Request) {
    let payload: any;

    try {
      payload = (this.authUtils as any)['jwt'].verify(dto.refreshToken);
    } catch {
      await this.authUtils.createAuthAuditLog({
        performerType: 'ROOT',
        performerId: null,
        action: 'REFRESH_TOKEN_INVALID',
        status: AuditStatus.FAILED,
        ipAddress: req ? this.authUtils.getClientIp(req) : null,
        userAgent: req ? this.authUtils.getClientUserAgent(req) : null,
        metadata: { error: 'JWT verify failed' },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload?.sub || payload.principalType !== 'ROOT') {
      await this.authUtils.createAuthAuditLog({
        performerType: 'ROOT',
        performerId: payload?.sub ?? null,
        action: 'REFRESH_TOKEN_INVALID',
        status: AuditStatus.FAILED,
        ipAddress: req ? this.authUtils.getClientIp(req) : null,
        userAgent: req ? this.authUtils.getClientUserAgent(req) : null,
        metadata: { error: 'Invalid payload principalType' },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const root = await this.prisma.root.findUnique({
      where: { id: payload.sub },
    });

    if (
      !root ||
      root.deletedAt ||
      root.status !== 'ACTIVE' ||
      root.refreshToken !== dto.refreshToken
    ) {
      await this.authUtils.createAuthAuditLog({
        performerType: 'ROOT',
        performerId: payload.sub,
        action: 'REFRESH_TOKEN_INVALID',
        status: AuditStatus.FAILED,
        ipAddress: req ? this.authUtils.getClientIp(req) : null,
        userAgent: req ? this.authUtils.getClientUserAgent(req) : null,
        metadata: { error: 'Root not found / status / mismatch' },
      });

      throw new UnauthorizedException('Invalid refresh token');
    }

    const actor = this.authUtils.createActor({
      id: root.id,
      principalType: 'ROOT',
      roleId: root.roleId,
      isRoot: true,
    });

    const tokens = this.authUtils.generateTokens(actor);

    await this.prisma.root.update({
      where: { id: root.id },
      data: { refreshToken: tokens.refreshToken },
    });

    const safeRoot = this.authUtils.stripSensitive(root, [
      'password',
      'refreshToken',
      'passwordResetToken',
    ]);

    await this.authUtils.createAuthAuditLog({
      performerType: 'ROOT',
      performerId: root.id,
      action: 'REFRESH_TOKEN_SUCCESS',
      status: AuditStatus.SUCCESS,
      ipAddress: req ? this.authUtils.getClientIp(req) : null,
      userAgent: req ? this.authUtils.getClientUserAgent(req) : null,
    });

    return {
      user: safeRoot,
      actor,
      tokens,
    };
  }

  async requestPasswordReset(dto: ForgotPasswordDto, req?: Request) {
    const root = await this.prisma.root.findUnique({
      where: { email: dto.email },
    });

    // Security: don't leak existence
    if (!root) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashed = this.authUtils.hashPassword(rawToken);

    const expires = new Date(Date.now() + 1000 * 60 * 3); // 3 min

    await this.prisma.root.update({
      where: { id: root.id },
      data: {
        passwordResetToken: hashed,
        passwordResetExpires: expires,
      },
    });

    // Use your EmailService to send reset link / token
    await this.emailService.sendPasswordResetEmail({
      firstName: root.firstName,
      resetUrl: `${process.env.RESET_PASSWORD_BASE_URL}?token=${rawToken}`,
      expiryMinutes: 3,
    });

    await this.authUtils.createAuthAuditLog({
      performerType: 'ROOT',
      performerId: root.id,
      action: 'PASSWORD_RESET_REQUESTED',
      status: AuditStatus.SUCCESS,
      ipAddress: req ? this.authUtils.getClientIp(req) : null,
      userAgent: req ? this.authUtils.getClientUserAgent(req) : null,
      metadata: {
        email: dto.email,
      },
    });

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async confirmPasswordReset(dto: ConfirmPasswordResetDto, req?: Request) {
    const { token } = dto;

    const candidateRoots = await this.prisma.root.findMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpires: { gt: new Date() },
      },
    });

    const matching = candidateRoots.find((root) => {
      try {
        this.authUtils.verifyPassword(token, root.passwordResetToken!);
        return true;
      } catch {
        return false;
      }
    });

    if (!matching) {
      await this.authUtils.createAuthAuditLog({
        performerType: 'ROOT',
        performerId: null,
        action: 'PASSWORD_RESET_CONFIRMATION_FAILED',
        status: AuditStatus.FAILED,
        ipAddress: req ? this.authUtils.getClientIp(req) : null,
        userAgent: req ? this.authUtils.getClientUserAgent(req) : null,
        metadata: {
          reason: 'INVALID_OR_EXPIRED_TOKEN',
        },
      });

      throw new BadRequestException('Invalid or expired token');
    }

    const newPasswordPlain = this.authUtils.generateRandomPassword();
    const newHashed = this.authUtils.hashPassword(newPasswordPlain);

    await this.prisma.root.update({
      where: { id: matching.id },
      data: {
        password: newHashed,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshToken: null,
      },
    });

    // Email new credentials to root (similar to old sendCredentialsEmail)
    await this.emailService.sendRootUserCredentialsEmail({
      firstName: matching.firstName,
      username: matching.username,
      email: matching.email,
      password: newPasswordPlain,
      actionType: 'reset',
    });

    await this.authUtils.createAuthAuditLog({
      performerType: 'ROOT',
      performerId: matching.id,
      action: 'PASSWORD_RESET_CONFIRMED',
      status: AuditStatus.SUCCESS,
      ipAddress: req ? this.authUtils.getClientIp(req) : null,
      userAgent: req ? this.authUtils.getClientUserAgent(req) : null,
    });

    return {
      message: 'Password reset successfully. New password has been issued.',
    };
  }

  async getCurrentUser(rootId: string) {
    const root = await this.prisma.root.findUnique({
      where: { id: rootId },
      include: {
        role: true,
      },
    });

    if (!root) {
      throw new NotFoundException('Root user not found');
    }

    const safeRoot = this.authUtils.stripSensitive(root, [
      'password',
      'refreshToken',
      'passwordResetToken',
    ]);

    return safeRoot;
  }

  async getDashboard(rootId: string, req?: Request) {
    const [totalAdmins, totalUsers, totalEmployees] = await Promise.all([
      this.prisma.user.count({
        where: {
          rootParentId: rootId,
          role: {
            name: 'ADMIN',
          },
        },
      }),
      this.prisma.user.count({
        where: {
          rootParentId: rootId,
          role: {
            NOT: { name: 'ADMIN' },
          },
        },
      }),
      this.prisma.employee.count({
        where: {
          createdByRootId: rootId,
        },
      }),
    ]);

    await this.authUtils.createAuthAuditLog({
      performerType: 'ROOT',
      performerId: rootId,
      action: 'DASHBOARD_ACCESSED',
      status: AuditStatus.SUCCESS,
      ipAddress: req ? this.authUtils.getClientIp(req) : null,
      userAgent: req ? this.authUtils.getClientUserAgent(req) : null,
      metadata: {
        dashboardType: 'ROOT_DASHBOARD',
      },
    });

    return {
      totalAdmins,
      totalBusinessUsers: totalUsers,
      totalEmployees,
    };
  }

  async updateCredentials(
    rootId: string,
    dto: UpdateCredentialsDto,
    req?: Request,
  ) {
    const root = await this.prisma.root.findUnique({
      where: { id: rootId },
    });

    if (!root) throw new NotFoundException('Root user not found');

    if (!dto.newPassword) {
      throw new BadRequestException('New password is required');
    }

    if (!dto.currentPassword) {
      throw new BadRequestException('Current password is required');
    }

    this.authUtils.verifyPassword(dto.currentPassword, root.password);

    const newHashed = this.authUtils.hashPassword(dto.newPassword);

    await this.prisma.root.update({
      where: { id: root.id },
      data: {
        password: newHashed,
        refreshToken: null,
      },
    });

    await this.authUtils.createAuthAuditLog({
      performerType: 'ROOT',
      performerId: rootId,
      action: 'CREDENTIALS_UPDATED',
      status: AuditStatus.SUCCESS,
      ipAddress: req ? this.authUtils.getClientIp(req) : null,
      userAgent: req ? this.authUtils.getClientUserAgent(req) : null,
      metadata: {
        updatedFields: ['password'],
        isOwnUpdate: true,
      },
    });

    return { message: 'Credentials updated successfully' };
  }

  async updateProfile(rootId: string, dto: UpdateProfileDto, req?: Request) {
    const root = await this.prisma.root.findUnique({
      where: { id: rootId },
    });

    if (!root) throw new NotFoundException('Root user not found');

    const data = {
      firstName: dto.firstName ?? root.firstName,
      lastName: dto.lastName ?? root.lastName,
      username: dto.username ?? root.username,
      phoneNumber: dto.phoneNumber ?? root.phoneNumber,
      email: dto.email ?? root.email,
    };

    await this.prisma.root.update({
      where: { id: rootId },
      data,
    });

    await this.authUtils.createAuthAuditLog({
      performerType: 'ROOT',
      performerId: rootId,
      action: 'PROFILE_UPDATED',
      status: AuditStatus.SUCCESS,
      ipAddress: req ? this.authUtils.getClientIp(req) : null,
      userAgent: req ? this.authUtils.getClientUserAgent(req) : null,
      metadata: {
        updatedFields: Object.keys(data),
      },
    });

    return this.getCurrentUser(rootId);
  }

  async updateProfileImage(
    rootId: string,
    file: Express.Multer.File,
    req?: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Profile image is required');
    }

    const root = await this.prisma.root.findUnique({
      where: { id: rootId },
    });

    if (!root) throw new NotFoundException('Root user not found');

    const oldImage = root.profileImage ?? null;

    const uploadedUrl = await this.s3.upload(file.path, 'profile');
    if (!uploadedUrl) {
      throw new BadRequestException('Failed to upload profile image');
    }

    if (oldImage) {
      await this.s3.delete({ fileUrl: oldImage }).catch(() => null);
    }

    await this.prisma.root.update({
      where: { id: rootId },
      data: {
        profileImage: uploadedUrl,
      },
    });

    // === Delete local temp file safely using FileDeleteHelper ===
    FileDeleteHelper.deleteUploadedImages(file);

    // === Audit log ===
    await this.authUtils.createAuthAuditLog({
      performerType: 'ROOT',
      performerId: rootId,
      action: 'PROFILE_IMAGE_UPDATED',
      status: AuditStatus.SUCCESS,
      ipAddress: req ? this.authUtils.getClientIp(req) : null,
      userAgent: req ? this.authUtils.getClientUserAgent(req) : null,
      metadata: {
        oldImageDeleted: !!oldImage,
        originalFilename: file.originalname,
      },
    });

    return this.getCurrentUser(rootId);
  }
}
