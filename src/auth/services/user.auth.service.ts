import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/database.connection';
import { PermissionService } from '../permission-registry/permission.service';
import { ForgotPasswordDto } from '../dto/forgot-password-auth.dto';
import { ConfirmPasswordResetDto } from '../dto/confirm-password-reset-auth.dto';
import { UpdateCredentialsDto } from '../dto/update-credentials-auth.dto';
import { UpdateProfileDto } from '../dto/update-profile-auth.dto';
import { AuthActor } from '../interface/auth.interface';
import { AuthUtilsService } from '../helper/auth-utils';
import { randomBytes } from 'node:crypto';
import { LoginDto } from '../dto/login-auth.dto';
import type { Request } from 'express';
import { EmailService } from '../email/email.service';
import { AuditStatus } from '../../common/audit-log/enums/audit-log.enum';
import { S3Service } from '../../utils/s3/s3.service';
import { IpWhitelistService } from '../../common/ip-whitelist/service/ip-whitelist.service';
import { FileDeleteHelper } from '../../utils/helper/file-delete-helper.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserAuthService {
  private logger = new Logger(UserAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authUtils: AuthUtilsService,
    private readonly permissionService: PermissionService,
    private readonly emailService: EmailService,
    private readonly s3: S3Service,
    private readonly ipWhitelistService: IpWhitelistService,
    private readonly configService: ConfigService,
  ) {}

  private async logAuthEvent(params: {
    performerId: string | null;
    action: string;
    status: AuditStatus;
    req?: Request;
    metadata?: any;
  }) {
    const { performerId, action, status, metadata, req } = params;

    await this.authUtils.createAuthAuditLog({
      performerType: 'USER',
      performerId: performerId,
      action,
      status,
      ipAddress: req ? this.authUtils.getClientIp(req) : null,
      userAgent: req ? this.authUtils.getClientUserAgent(req) : null,
      metadata: metadata || {},
    });
  }

  private toSafeUser(user: any) {
    return this.authUtils.stripSensitive(user, [
      'password',
      'refreshToken',
      'passwordResetToken',
      'transactionPin',
      'transactionPinSalt',
    ]);
  }

  async login(dto: LoginDto, req: Request) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { customerId: dto.customerId }],
      },
      include: {
        role: true,
        rootParent: {
          select: {
            id: true,
            username: true,
            status: true,
          },
        },
        parent: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    const ip = this.authUtils.getClientIp(req);
    const origin = this.authUtils.getClientOrigin(req);

    // 1. Basic checks
    if (!user || user.deletedAt) {
      await this.logAuthEvent({
        performerId: user?.id ?? null,
        action: 'LOGIN_FAILED',
        status: AuditStatus.FAILED,
        req,
        metadata: {
          reason: 'USER_NOT_FOUND_OR_DELETED',
          identifier: dto.email || dto.customerId,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. User status check
    if (user.status !== 'ACTIVE') {
      await this.logAuthEvent({
        performerId: user.id,
        action: 'LOGIN_FAILED',
        status: AuditStatus.FAILED,
        req,
        metadata: {
          reason: 'USER_INACTIVE',
          status: user.status,
        },
      });
      throw new UnauthorizedException(
        `Account is ${user.status.toLowerCase()}`,
      );
    }

    // 3. Password verification
    if (!this.authUtils.verifyPassword(dto.password, user.password)) {
      await this.logAuthEvent({
        performerId: user.id,
        action: 'LOGIN_FAILED',
        status: AuditStatus.FAILED,
        req,
        metadata: { reason: 'INVALID_PASSWORD' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. ADMIN users ke liye special check
    if (user.role.name === 'ADMIN') {
      // ADMIN ka sirf rootParent check karo
      if (!user.rootParent) {
        await this.logAuthEvent({
          performerId: user.id,
          action: 'LOGIN_FAILED',
          status: AuditStatus.FAILED,
          req,
          metadata: { reason: 'ADMIN_NO_ROOT_PARENT' },
        });
        throw new UnauthorizedException(
          'Admin account configuration incomplete',
        );
      }

      // ADMIN ke root parent ACTIVE hona chahiye
      if (user.rootParent.status !== 'ACTIVE') {
        await this.logAuthEvent({
          performerId: user.id,
          action: 'LOGIN_FAILED',
          status: AuditStatus.FAILED,
          req,
          metadata: {
            reason: 'ADMIN_ROOT_PARENT_INACTIVE',
            rootStatus: user.rootParent.status,
          },
        });
        throw new UnauthorizedException('Root account is not active');
      }
    }
    // Other hierarchy users (STATE_HEAD, MASTER_DISTRIBUTOR, etc.)
    else {
      // 4a. Root parent existence and status check
      if (!user.rootParent) {
        await this.logAuthEvent({
          performerId: user.id,
          action: 'LOGIN_FAILED',
          status: AuditStatus.FAILED,
          req,
          metadata: { reason: 'NO_ROOT_PARENT' },
        });
        throw new UnauthorizedException('Account configuration incomplete');
      }

      // 4b. Root parent must be ACTIVE
      if (user.rootParent.status !== 'ACTIVE') {
        await this.logAuthEvent({
          performerId: user.id,
          action: 'LOGIN_FAILED',
          status: AuditStatus.FAILED,
          req,
          metadata: {
            reason: 'ROOT_PARENT_INACTIVE',
            rootStatus: user.rootParent.status,
          },
        });
        throw new UnauthorizedException('Root account is not active');
      }

      // 4c. Parent user must exist for non-ADMIN users
      if (!user.parent) {
        await this.logAuthEvent({
          performerId: user.id,
          action: 'LOGIN_FAILED',
          status: AuditStatus.FAILED,
          req,
          metadata: {
            reason: 'NO_PARENT_USER',
            role: user.role.name,
          },
        });
        throw new UnauthorizedException('Parent user account not found');
      }

      // 4d. Parent user must be ACTIVE
      const parentUser = await this.prisma.user.findUnique({
        where: { id: user.parent.id },
        select: { status: true },
      });

      if (!parentUser || parentUser.status !== 'ACTIVE') {
        await this.logAuthEvent({
          performerId: user.id,
          action: 'LOGIN_FAILED',
          status: AuditStatus.FAILED,
          req,
          metadata: {
            reason: 'PARENT_USER_INACTIVE',
            parentId: user.parent.id,
          },
        });
        throw new UnauthorizedException('Parent user account is not active');
      }

      // 4e. Hierarchy validation - parent ka role higher hierarchy level me hona chahiye
      const parentRole = await this.prisma.role.findUnique({
        where: { id: user.parent.role.id },
      });

      if (parentRole && parentRole.hierarchyLevel >= user.role.hierarchyLevel) {
        await this.logAuthEvent({
          performerId: user.id,
          action: 'LOGIN_FAILED',
          status: AuditStatus.FAILED,
          req,
          metadata: {
            reason: 'INVALID_HIERARCHY',
            userRoleLevel: user.role.hierarchyLevel,
            parentRoleLevel: parentRole.hierarchyLevel,
            expected: 'parentLevel < childLevel',
            actual: `parentLevel (${parentRole.hierarchyLevel}) ${parentRole.hierarchyLevel >= user.role.hierarchyLevel ? '>=' : '<'} childLevel (${user.role.hierarchyLevel})`,
          },
        });
        throw new UnauthorizedException('Invalid hierarchy configuration');
      }
    }

    // 5. IP Whitelist check - STRICT RULES AS PER REQUIREMENTS
    let allowedDomains: string[] = [];
    let allowedIps: string[] = [];
    let whitelistSource = '';

    if (user.role.name === 'ADMIN') {
      // RULE 1: ADMIN ke liye sirf khud ki whitelist check karo
      const adminWhitelist = await this.ipWhitelistService.findUserWhitelist(
        user.id,
      );
      allowedDomains = adminWhitelist.map((w) => w.domainName).filter(Boolean);
      allowedIps = adminWhitelist.map((w) => w.serverIp).filter(Boolean);
      whitelistSource = 'ADMIN_OWN';

      // RULE 2: Agar ADMIN ka khud ka whitelist nahi hai to ERROR
      if (allowedDomains.length === 0 && allowedIps.length === 0) {
        await this.logAuthEvent({
          performerId: user.id,
          action: 'LOGIN_FAILED',
          status: AuditStatus.FAILED,
          req,
          metadata: {
            reason: 'ADMIN_NO_WHITELIST',
            role: user.role.name,
          },
        });
        throw new ForbiddenException(
          'Admin IP whitelist not configured. Please contact administrator.',
        );
      }
    } else {
      // RULE 3: ADMIN ke users ke liye: SIRF ADMIN se inherit karo
      if (!user.parent) {
        await this.logAuthEvent({
          performerId: user.id,
          action: 'LOGIN_FAILED',
          status: AuditStatus.FAILED,
          req,
          metadata: {
            reason: 'NO_PARENT_FOR_WHITELIST',
            role: user.role.name,
          },
        });
        throw new UnauthorizedException('Cannot determine IP whitelist source');
      }

      // RULE 4: DIRECT ADMIN se whitelist inherit karo
      const parentAdminWhitelist =
        await this.ipWhitelistService.findUserWhitelist(user.parent.id);
      allowedDomains = parentAdminWhitelist
        .map((w) => w.domainName)
        .filter(Boolean);
      allowedIps = parentAdminWhitelist.map((w) => w.serverIp).filter(Boolean);
      whitelistSource = 'INHERITED_FROM_ADMIN';

      // RULE 5: Agar ADMIN ke paas bhi whitelist nahi hai to ERROR
      if (allowedDomains.length === 0 && allowedIps.length === 0) {
        await this.logAuthEvent({
          performerId: user.id,
          action: 'LOGIN_FAILED',
          status: AuditStatus.FAILED,
          req,
          metadata: {
            reason: 'PARENT_ADMIN_NO_WHITELIST',
            role: user.role.name,
            parentId: user.parent.id,
          },
        });
        throw new ForbiddenException(
          'Parent admin has no IP whitelist configured',
        );
      }
    }

    // 6. Domain/Origin validation (mandatory since whitelist must exist)
    if (
      allowedDomains.length > 0 &&
      !this.authUtils.isValidOrigin(origin, allowedDomains)
    ) {
      await this.logAuthEvent({
        performerId: user.id,
        action: 'LOGIN_FAILED',
        status: AuditStatus.FAILED,
        req,
        metadata: {
          reason: 'ORIGIN_NOT_ALLOWED',
          origin,
          allowedDomains,
          userRole: user.role.name,
          whitelistSource,
        },
      });
      throw new ForbiddenException('Origin not allowed');
    }

    if (allowedIps.length > 0 && !this.authUtils.isValidIp(ip, allowedIps)) {
      await this.logAuthEvent({
        performerId: user.id,
        action: 'LOGIN_FAILED',
        status: AuditStatus.FAILED,
        req,
        metadata: {
          reason: 'IP_NOT_ALLOWED',
          ip,
          allowedIps,
          userRole: user.role.name,
          whitelistSource,
        },
      });
      throw new ForbiddenException('IP address not allowed');
    }

    // 7. Create actor with complete hierarchy information
    const actor: AuthActor = this.authUtils.createActor({
      id: user.id,
      roleId: user.roleId,
      principalType: 'USER',
      isRoot: false,
      // hierarchyLevel: user.hierarchyLevel,
      // roleName: user.role.name,
      // rootParentId: user.rootParentId,
      // parentId: user.parentId,
    });

    const tokens = this.authUtils.generateTokens(actor);
    const hashedRefresh = this.authUtils.hashPassword(tokens.refreshToken);

    // 8. Update user login info
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefresh,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        lastLoginOrigin: origin,
      },
    });

    // 9. Get permissions based on role
    const permissions =
      await this.permissionService.getEffectivePermissions(actor);

    // 10. Log success
    await this.logAuthEvent({
      performerId: user.id,
      action: 'LOGIN_SUCCESS',
      status: AuditStatus.SUCCESS,
      req,
      metadata: {
        role: user.role.name,
        hierarchyLevel: user.hierarchyLevel,
        rootParentId: user.rootParentId,
        parentId: user.parentId,
        hasTransactionPin: !!user.transactionPin,
        ip,
        origin,
        whitelistSource,
        whitelistDomains: allowedDomains,
        whitelistIps: allowedIps,
      },
    });

    // Prepare response
    const response = {
      user: this.toSafeUser(user),
      actor,
      tokens,
      permissions,
      hasTransactionPin: !!user.transactionPin,
      ipWhitelistInfo: {
        hasWhitelist: true,
        source: whitelistSource,
        domains: allowedDomains,
        ips: allowedIps,
      },
    };

    // Add hierarchy info
    if (user.role.name === 'ADMIN') {
      response['hierarchyInfo'] = {
        type: 'ADMIN',
        rootParent: user.rootParent,
        parent: null,
        canCreateDownline: true,
        canAccessAllDownline: true,
        ipWhitelistRule: 'SELF_CONFIGURED_MANDATORY',
      };
    } else {
      response['hierarchyInfo'] = {
        type: user.role.name,
        rootParent: user.rootParent,
        parent: user.parent,
        canCreateDownline: await this.canCreateDownline(user.role.name),
        canAccessDownline: await this.canAccessDownline(
          user.id,
          user.role.name,
        ),
        ipWhitelistRule: 'INHERITED_FROM_ADMIN_MANDATORY',
      };
    }

    return response;
  } //test

  async logout(userId: string, req: Request) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await this.logAuthEvent({
      performerId: userId,
      action: 'LOGOUT',
      status: AuditStatus.SUCCESS,
      req,
    });

    return { message: 'Logged out successfully' };
  }

  async refreshToken(rawToken: string, req: Request) {
    const payload = this.authUtils.verifyJwt(rawToken);

    if (!payload || payload.principalType !== 'USER') {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !this.authUtils.verifyPassword(rawToken, user.refreshToken!)) {
      await this.logAuthEvent({
        performerId: payload.sub,
        action: 'REFRESH_TOKEN_INVALID',
        status: AuditStatus.FAILED,
        req,
      });

      throw new UnauthorizedException('Invalid refresh token');
    }

    const actor = this.authUtils.createActor({
      id: user.id,
      principalType: 'USER',
      roleId: user.roleId,
      isRoot: false,
    });

    const tokens = this.authUtils.generateTokens(actor);
    const hashedRefresh = this.authUtils.hashPassword(tokens.refreshToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    await this.logAuthEvent({
      performerId: user.id,
      action: 'REFRESH_TOKEN_SUCCESS',
      status: AuditStatus.SUCCESS,
      req,
    });

    return {
      user: this.toSafeUser(user),
      actor,
      tokens,
    };
  }

  async requestPasswordReset(
    dto: ForgotPasswordDto,
    currentUser: AuthActor,
    req?: Request,
  ) {
    // 1. Authenticated user ka email verify karo
    const authenticatedUser = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!authenticatedUser) {
      throw new UnauthorizedException('User not found');
    }

    // 2. Verify that the requested email belongs to current user
    if (authenticatedUser.email !== dto.email) {
      // Optional: Log failed attempt
      await this.logAuthEvent({
        performerId: currentUser.id,
        action: 'PASSWORD_RESET_REQUEST_FAILED',
        status: AuditStatus.FAILED,
        metadata: {
          details: `Attempted to reset password for email: ${dto.email}`,
        },
        req,
      });

      throw new ForbiddenException('You can only reset your own password');
    }

    // 3. Continue with existing logic
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If account exists, password reset email sent.' };
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = this.authUtils.hashResetToken(rawToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 3 * 60 * 1000),
      },
    });

    await this.emailService.sendPasswordResetEmail({
      firstName: user.firstName,
      supportEmail: user.email,
      resetUrl: `${this.configService.get<string>('security.resetPasswordBaseUrl')}?token=${rawToken}`,
      expiryMinutes: 3,
    });

    await this.logAuthEvent({
      performerId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      status: AuditStatus.SUCCESS,
      req,
    });

    return { message: 'Password reset email sent.' };
  }

  async confirmPasswordReset(
    dto: ConfirmPasswordResetDto,
    currentUser?: AuthActor,
    req?: Request,
  ) {
    const hashedToken = this.authUtils.hashResetToken(dto.token);

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      await this.logAuthEvent({
        performerId: currentUser?.id || null,
        action: 'PASSWORD_RESET_FAILED',
        status: AuditStatus.FAILED,
        req,
      });
      throw new BadRequestException('Invalid or expired token');
    }

    if (currentUser && user.id !== currentUser.id) {
      throw new ForbiddenException('You can only reset your own password');
    }

    const newPasswordPlain = this.authUtils.generateRandomPassword();
    const newPinPlain = this.authUtils.generateRandomTransactionPin();
    const newHashed = this.authUtils.hashPassword(newPasswordPlain);
    const newPinHashed = this.authUtils.hashPassword(newPinPlain);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHashed,
        transactionPin: newPinHashed,
        refreshToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    await this.emailService.sendBusinessUserCredentialsEmail({
      firstName: user.firstName,
      username: user.username,
      email: user.email,
      password: newPasswordPlain,
      transactionPin: newPinPlain,
      actionType: 'reset',
    });

    await this.logAuthEvent({
      performerId: user.id,
      action: 'PASSWORD_RESET_CONFIRMED',
      status: AuditStatus.SUCCESS,
      req,
    });

    return {
      message:
        'Password reset successful. New password and transaction PIN sent to your email.',
      hasTransactionPin: true,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        rootParent: { select: { id: true, username: true } },
        parent: { select: { id: true, username: true, role: true } },
        businessKyc: { select: { status: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return this.toSafeUser(user);
  }

  async getDashboard(userId: string, req?: Request) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const [directChildren, totalDownline, totalEmployees, walletBalance] =
      await Promise.all([
        this.prisma.user.count({
          where: { parentId: userId },
        }),
        this.prisma.user.count({
          where: {
            hierarchyPath: { startsWith: user.hierarchyPath },
            id: { not: userId },
          },
        }),
        this.prisma.employee.count({
          where: { createdByUserId: userId },
        }),
        this.prisma.wallet.aggregate({
          where: { userId, walletType: 'PRIMARY' },
          _sum: { availableBalance: true },
        }),
      ]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayTransactions = await this.prisma.transaction.count({
      where: {
        userId,
        initiatedAt: { gte: startOfDay },
        status: 'SUCCESS',
      },
    });

    await this.logAuthEvent({
      performerId: userId,
      action: 'DASHBOARD_ACCESSED',
      status: AuditStatus.SUCCESS,
      req,
    });

    return {
      userInfo: {
        role: user.role.name,
        hierarchyLevel: user.hierarchyLevel,
        isKycVerified: user.isKycVerified,
        hasTransactionPin: !!user.transactionPin,
      },
      stats: {
        directDownline: directChildren,
        totalDownlineUsers: totalDownline,
        totalEmployees: totalEmployees,
        walletBalance: this.authUtils.money(
          walletBalance._sum.availableBalance,
        ),

        todayTransactions: todayTransactions,
      },
    };
  }

  async updateCredentials(
    userId: string,
    dto: UpdateCredentialsDto,
    req?: Request,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!dto.newPassword || !dto.currentPassword) {
      throw new BadRequestException('Current & new password required');
    }

    if (!this.authUtils.verifyPassword(dto.currentPassword, user.password)) {
      throw new UnauthorizedException('Invalid current password');
    }

    const newHashed = this.authUtils.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHashed,
        refreshToken: null,
      },
    });

    await this.logAuthEvent({
      performerId: userId,
      action: 'CREDENTIALS_UPDATED',
      status: AuditStatus.SUCCESS,
      req,
      metadata: { updatedFields: ['password'] },
    });

    return { message: 'Credentials updated successfully' };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, req?: Request) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }
    }

    if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (existingPhone) {
        throw new BadRequestException('Phone number already exists');
      }
    }

    if (dto.username && dto.username !== user.username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existingUsername) {
        throw new BadRequestException('Username already exists');
      }
    }

    const data = {
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      username: dto.username ?? user.username,
      phoneNumber: dto.phoneNumber ?? user.phoneNumber,
      email: dto.email ?? user.email,
    };

    await this.prisma.user.update({ where: { id: userId }, data });

    await this.logAuthEvent({
      performerId: userId,
      action: 'PROFILE_UPDATED',
      status: AuditStatus.SUCCESS,
      req,
      metadata: { updatedFields: Object.keys(data) },
    });

    return this.getCurrentUser(userId);
  }

  async updateProfileImage(
    userId: string,
    file: Express.Multer.File,
    req?: Request,
  ) {
    if (!file) throw new BadRequestException('Profile image required');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const oldImage = user.profileImage;

    const uploadedUrl = await this.s3.uploadBuffer(file, 'user-profile-images');

    if (!uploadedUrl) throw new BadRequestException('Upload failed');

    if (oldImage) {
      await this.s3.delete({ fileUrl: oldImage }).catch(() => null);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: uploadedUrl },
    });

    FileDeleteHelper.deleteUploadedImages(file);

    await this.logAuthEvent({
      performerId: userId,
      action: 'PROFILE_IMAGE_UPDATED',
      status: AuditStatus.SUCCESS,
      req,
      metadata: { oldImageDeleted: !!oldImage },
    });

    return this.getCurrentUser(userId);
  }

  // Hierarchy methods
  async getDownlineUsers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const downlineUsers = await this.prisma.user.findMany({
      where: {
        hierarchyPath: { startsWith: user.hierarchyPath },
        id: { not: userId },
      },
      include: {
        role: true,
        wallets: {
          where: { walletType: 'PRIMARY' },
          select: { availableBalance: true },
        },
      },
      orderBy: { hierarchyLevel: 'desc' },
    });

    return {
      currentUser: {
        id: user.id,
        username: user.username,
        role: user.role.name,
        hierarchyLevel: user.hierarchyLevel,
      },
      downlineUsers: downlineUsers.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        phoneNumber: u.phoneNumber,
        role: u.role.name,
        hierarchyLevel: u.hierarchyLevel,
        status: u.status,
        walletBalance: this.authUtils.money(u.wallets[0]?.availableBalance),
        isKycVerified: u.isKycVerified,
      })),
      totalDownline: downlineUsers.length,
    };
  }

  async getHierarchyInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,

        parent: {
          include: { role: true },
        },

        rootParent: {
          include: { role: true },
        },

        children: {
          include: {
            role: true,
            children: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const isAdmin = user.role.name === 'ADMIN';

    const selectedUpline = isAdmin ? user.rootParent : user.parent;

    const upline = selectedUpline
      ? {
          id: selectedUpline.id,
          username: selectedUpline.username,
          role: selectedUpline.role?.name ?? 'ROOT',
          hierarchyLevel: selectedUpline.hierarchyLevel,
        }
      : null;

    return {
      current: {
        id: user.id,
        username: user.username,
        role: user.role.name,
        hierarchyLevel: user.hierarchyLevel,
      },

      upline, // dynamic upline based on your requested condition

      downline: user.children.map((child) => ({
        id: child.id,
        username: child.username,
        role: child.role.name,
        hierarchyLevel: child.hierarchyLevel,
        childrenCount: child.children.length,
      })),
    };
  }

  async validateHierarchyAccess(
    requesterId: string,
    targetId: string,
  ): Promise<boolean> {
    const [requester, target] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: requesterId },
      }),
      this.prisma.user.findUnique({
        where: { id: targetId },
      }),
    ]);

    if (!requester || !target) {
      return false;
    }

    if (requester.rootParentId !== target.rootParentId) {
      return false;
    }

    if (!target.hierarchyPath.startsWith(requester.hierarchyPath)) {
      return false;
    }

    return true;
  }

  private async canAccessDownline(
    userId: string,
    roleName: string,
  ): Promise<{ roleName: string; canAccess: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: { select: { name: true } } },
    });

    if (!user) return { roleName, canAccess: false };

    const downlineCount = await this.prisma.user.count({
      where: {
        hierarchyPath: { startsWith: user.hierarchyPath },
        id: { not: userId },
      },
    });

    return { roleName, canAccess: downlineCount > 0 };
  }

  private async canCreateDownline(roleName: string): Promise<boolean> {
    const role = await this.prisma.role.findFirst({
      where: { name: roleName },
      select: { hierarchyLevel: true },
    });

    if (!role) return false;

    // Check if there are roles below this role in hierarchy
    const lowerRoles = await this.prisma.role.findMany({
      where: {
        hierarchyLevel: { lt: role.hierarchyLevel },
      },
      take: 1,
    });

    return lowerRoles.length > 0;
  }
}
