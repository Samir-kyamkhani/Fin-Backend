import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/database.connection'
import { PermissionService } from '../permission-registry/permission.service'
import { ForgotPasswordDto } from '../dto/forgot-password-auth.dto'
import { ConfirmPasswordResetDto } from '../dto/confirm-password-reset-auth.dto'
import { UpdateCredentialsDto } from '../dto/update-credentials-auth.dto'
import { UpdateProfileDto } from '../dto/update-profile-auth.dto'
import { TokenPair } from '../interface/auth.interface'
import { randomBytes } from 'node:crypto';
import { AuthUtilsService } from '../helper/auth-utils'
import { LoginDto } from '../dto/login-auth.dto'

@Injectable()
export class UserAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authUtils: AuthUtilsService,
    private readonly permissionService: PermissionService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { customerId: dto.customerId }],
      },
      include: {
        role: true,
      },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.authUtils.verifyPassword(dto.password, user.password);

    const actor = this.authUtils.createActor({
      id: user.id,
      principalType: 'USER',
      roleId: user.roleId,
      isRoot: false,
    });

    const tokens: TokenPair = this.authUtils.generateTokens(actor);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: tokens.refreshToken,
        lastLoginAt: new Date(),
      },
    });

    const permissions =
      await this.permissionService.getEffectivePermissions(actor);

    const safeUser = this.authUtils.stripSensitive(user, [
      'password',
      'refreshToken',
      'passwordResetToken',
    ]);
    return {
      user: safeUser,
      actor,
      tokens,
      permissions,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  async refreshToken(rawToken: string) {
    let payload: any;
    try {
      payload = this.authUtils['jwt'].verify(rawToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload?.sub || payload.principalType !== 'USER') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (
      !user ||
      user.deletedAt ||
      user.status !== 'ACTIVE' ||
      user.refreshToken !== rawToken
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const actor = this.authUtils.createActor({
      id: user.id,
      principalType: 'USER',
      roleId: user.roleId,
    });

    const tokens = this.authUtils.generateTokens(actor);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    const safeUser = this.authUtils.stripSensitive(user, [
      'password',
      'refreshToken',
    ]);

    return {
      user: safeUser,
      actor,
      tokens,
    };
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashed = this.authUtils.hashPassword(rawToken);

    const expires = new Date(Date.now() + 1000 * 60 * 30);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashed,
        passwordResetExpires: expires,
      },
    });

    // TODO: send email with rawToken
    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async confirmPasswordReset(dto: ConfirmPasswordResetDto) {
    const { token } = dto;

    const candidateUsers = await this.prisma.user.findMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpires: { gt: new Date() },
      },
    });

    const matching = candidateUsers.find((user) => {
      try {
        this.authUtils.verifyPassword(token, user.passwordResetToken!);
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

    await this.prisma.user.update({
      where: { id: matching.id },
      data: {
        password: newHashed,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // TODO: send newPasswordPlain to user via email
    return {
      message: 'Password reset successfully.',
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const safeUser = this.authUtils.stripSensitive(user, [
      'password',
      'refreshToken',
      'passwordResetToken',
    ]);

    return safeUser;
  }

  async getDashboard(userId: string) {
    // Example: show stats of children in hierarchy
    const totalChildren = await this.prisma.user.count({
      where: {
        parentId: userId,
      },
    });

    const totalEmployees = await this.prisma.employee.count({
      where: {
        createdByUserId: userId,
      },
    });

    return {
      totalDownlineUsers: totalChildren,
      totalEmployees,
    };
  }

  async updateCredentials(userId: string, dto: UpdateCredentialsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!dto.newPassword || !dto.currentPassword) {
      throw new BadRequestException(
        'Current password and new password are required',
      );
    }

    this.authUtils.verifyPassword(dto.currentPassword, user.password);

    const newHashed = this.authUtils.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHashed,
        refreshToken: null,
      },
    });

    return { message: 'Credentials updated successfully' };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName ?? user.firstName,
        lastName: dto.lastName ?? user.lastName,
        username: dto.username ?? user.username,
        phoneNumber: dto.phoneNumber ?? user.phoneNumber,
        email: dto.email ?? user.email,
      },
    });

    return this.getCurrentUser(userId);
  }

  async updateProfileImage(userId: string, filePath: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: filePath },
    });

    return this.getCurrentUser(userId);
  }

  // -------- ROOT + ADMIN CAN CREATE EMPLOYEE --------
  async createEmployeeByRoot(
    rootId: string,
    payload: {
      username: string;
      email: string;
      phoneNumber: string;
      password: string;
      departmentId: string;
      firstName: string;
      lastName: string;
    },
  ) {
    const root = await this.prisma.root.findUnique({ where: { id: rootId } });
    if (!root || root.deletedAt || root.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid root');
    }

    const hashed = this.authUtils.hashPassword(payload.password);

    return this.prisma.employee.create({
      data: {
        username: payload.username,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        firstName: payload.firstName,
        lastName: payload.lastName,
        password: hashed,
        departmentId: payload.departmentId,
        createdByType: 'ROOT',
        createdByRootId: root.id,
        createdByUserId: '', // still required in schema, you can adjust to nullable if needed
        hierarchyLevel: 0,
        hierarchyPath: '0',
      },
    });
  }

  async createEmployeeByAdmin(
    adminUserId: string,
    payload: {
      username: string;
      email: string;
      phoneNumber: string;
      password: string;
      departmentId: string;
      firstName: string;
      lastName: string;
    },
  ) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      include: { role: true },
    });

    if (!admin || admin.deletedAt || admin.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid user');
    }

    if (admin.role.name !== 'ADMIN') {
      throw new UnauthorizedException('Only ADMIN can create employees');
    }

    const hashed = this.authUtils.hashPassword(payload.password);

    return this.prisma.employee.create({
      data: {
        username: payload.username,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        firstName: payload.firstName,
        lastName: payload.lastName,
        password: hashed,
        departmentId: payload.departmentId,
        createdByType: 'USER',
        createdByUserId: admin.id,
        createdByRootId: '', // adjust schema to optional if possible
        hierarchyLevel: 0,
        hierarchyPath: '0',
      },
    });
  }
}
