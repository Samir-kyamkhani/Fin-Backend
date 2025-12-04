import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/database.connection.js';
import { PermissionService } from '../permission-registry/permission.service.js';
import { RefreshTokenDto } from '../dto/refresh-token-auth.dto.js';
import { ForgotPasswordDto } from '../dto/forgot-password-auth.dto.js';
import { ConfirmPasswordResetDto } from '../dto/confirm-password-reset-auth.dto.js';
import { UpdateCredentialsDto } from '../dto/update-credentials-auth.dto.js';
import { UpdateProfileDto } from '../dto/update-profile-auth.dto.js';
import { TokenPair } from '../interface/auth.interface.js';
import { AuthUtilsService } from '../helper/auth-utils.js';
import { randomBytes } from 'node:crypto';
import { LoginDto } from '../dto/login-auth.dto.js';

@Injectable()
export class RootAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authUtils: AuthUtilsService,
    private readonly permissionService: PermissionService,
  ) {}

  async login(dto: LoginDto) {
    const root = await this.prisma.root.findFirst({
      where: {
        OR: [{ email: dto.email }],
      },
      include: {
        role: true,
      },
    });

    if (!root || root.deletedAt || root.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.authUtils.verifyPassword(dto.password, root.password);

    const actor = this.authUtils.createActor({
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
      },
    });

    // Root technically has full access, but we keep pattern same
    const permissions =
      await this.permissionService.getEffectivePermissions(actor);

    const safeRoot = this.authUtils.stripSensitive(root, [
      'password',
      'refreshToken',
      'passwordResetToken',
    ]);

    return {
      user: safeRoot,
      actor,
      tokens,
      permissions,
    };
  }

  async logout(rootId: string) {
    await this.prisma.root.update({
      where: { id: rootId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  async refreshToken(dto: RefreshTokenDto) {
    let payload: any;
    try {
      payload = this.authUtils['jwt'].verify(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload?.sub || payload.principalType !== 'ROOT') {
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
    ]);

    return {
      user: safeRoot,
      actor,
      tokens,
    };
  }

  // -------- PASSWORD RESET REQUEST --------
  async requestPasswordReset(dto: ForgotPasswordDto) {
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

    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    await this.prisma.root.update({
      where: { id: root.id },
      data: {
        passwordResetToken: hashed,
        passwordResetExpires: expires,
      },
    });

    // TODO: integrate mailer service here, send `rawToken` to root email
    // using a separate EmailService.

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async confirmPasswordReset(dto: ConfirmPasswordResetDto) {
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
      },
    });

    // TODO: Mail new password to root user securely
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

  async getDashboard(rootId: string) {
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
            NOT: {
              name: 'ADMIN',
            },
          },
        },
      }),

      this.prisma.employee.count({
        where: {
          createdByRootId: rootId,
        },
      }),
    ]);

    return {
      totalAdmins,
      totalBusinessUsers: totalUsers,
      totalEmployees,
    };
  }

  async updateCredentials(rootId: string, dto: UpdateCredentialsDto) {
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

    return { message: 'Credentials updated successfully' };
  }

  async updateProfile(rootId: string, dto: UpdateProfileDto) {
    const root = await this.prisma.root.findUnique({
      where: { id: rootId },
    });

    if (!root) throw new NotFoundException('Root user not found');

    await this.prisma.root.update({
      where: { id: rootId },
      data: {
        firstName: dto.firstName ?? root.firstName,
        lastName: dto.lastName ?? root.lastName,
        username: dto.username ?? root.username,
        phoneNumber: dto.phoneNumber ?? root.phoneNumber,
        email: dto.email ?? root.email,
      },
    });

    return this.getCurrentUser(rootId);
  }

  async updateProfileImage(rootId: string, filePath: string) {
    // yaha S3/local file logic tum apne hisab se laga sakte ho
    // For now, assume filePath is final URL:
    await this.prisma.root.update({
      where: { id: rootId },
      data: {
        profileImage: filePath,
      },
    });

    return this.getCurrentUser(rootId);
  }
}
