import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/database.connection.js';
import { PermissionService } from '../permission-registry/permission.service.js';
import { LoginDto } from '../dto/login-auth.dto.js';
import { RefreshTokenDto } from '../dto/refresh-token-auth.dto.js';
import { ForgotPasswordDto } from '../dto/forgot-password-auth.dto.js';
import { ConfirmPasswordResetDto } from '../dto/confirm-password-reset-auth.dto.js';
import { UpdateCredentialsDto } from '../dto/update-credentials-auth.dto.js';
import { UpdateProfileDto } from '../dto/update-profile-auth.dto.js';
import { TokenPair } from '../interface/auth.interface.js';
import { randomBytes } from 'node:crypto';
import { AuthUtilsService } from '../helper/auth-utils.js';

@Injectable()
export class EmployeeAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authUtils: AuthUtilsService,
    private readonly permissionService: PermissionService,
  ) {}

  async login(dto: LoginDto) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        OR: [{ email: dto.email }],
      },
      include: {
        department: true,
      },
    });

    if (!employee || employee.deletedAt || employee.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.authUtils.verifyPassword(dto.password, employee.password);

    const actor = this.authUtils.createActor({
      id: employee.id,
      principalType: 'EMPLOYEE',
      departmentId: employee.departmentId,
      isRoot: false,
    });

    const tokens: TokenPair = this.authUtils.generateTokens(actor);

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        refreshToken: tokens.refreshToken,
        lastLoginAt: new Date(),
      },
    });

    const permissions =
      await this.permissionService.getEffectivePermissions(actor);

    const safeEmployee = this.authUtils.stripSensitive(employee, [
      'password',
      'refreshToken',
      'passwordResetToken',
    ]);

    return {
      user: safeEmployee,
      actor,
      tokens,
      permissions,
    };
  }

  async logout(employeeId: string) {
    await this.prisma.employee.update({
      where: { id: employeeId },
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

    if (!payload?.sub || payload.principalType !== 'EMPLOYEE') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: payload.sub },
    });

    if (
      !employee ||
      employee.deletedAt ||
      employee.status !== 'ACTIVE' ||
      employee.refreshToken !== dto.refreshToken
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const actor = this.authUtils.createActor({
      id: employee.id,
      principalType: 'EMPLOYEE',
      departmentId: employee.departmentId,
    });

    const tokens = this.authUtils.generateTokens(actor);

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { refreshToken: tokens.refreshToken },
    });

    const safeEmployee = this.authUtils.stripSensitive(employee, [
      'password',
      'refreshToken',
    ]);
    return {
      user: safeEmployee,
      actor,
      tokens,
    };
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });

    if (!employee) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashed = this.authUtils.hashPassword(rawToken);
    const expires = new Date(Date.now() + 1000 * 60 * 30);

    await this.prisma.employee.update({
      where: { id: employee.id },
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

    const candidateEmployees = await this.prisma.employee.findMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpires: { gt: new Date() },
      },
    });

    const matching = candidateEmployees.find((emp) => {
      try {
        this.authUtils.verifyPassword(token, emp.passwordResetToken!);
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

    await this.prisma.employee.update({
      where: { id: matching.id },
      data: {
        password: newHashed,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // TODO: send newPasswordPlain via email
    return {
      message: 'Password reset successfully.',
    };
  }

  async getCurrentUser(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true },
    });

    if (!employee) throw new NotFoundException('Employee not found');

    const safeEmployee = this.authUtils.stripSensitive(employee, [
      'password',
      'refreshToken',
      'passwordResetToken',
    ]);

    return safeEmployee;
  }

  async getDashboard(employeeId: string) {
    const permsCount = await this.prisma.employeePermission.count({
      where: { employeeId },
    });

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true },
    });

    return {
      permissionsCount: permsCount,
      department: employee?.department?.name ?? null,
    };
  }

  async updateCredentials(employeeId: string, dto: UpdateCredentialsDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) throw new NotFoundException('Employee not found');

    if (!dto.newPassword || !dto.currentPassword) {
      throw new BadRequestException(
        'Current password and new password are required',
      );
    }

    this.authUtils.verifyPassword(dto.currentPassword, employee.password);

    const newHashed = this.authUtils.hashPassword(dto.newPassword);

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        password: newHashed,
        refreshToken: null,
      },
    });

    return { message: 'Credentials updated successfully' };
  }

  async updateProfile(employeeId: string, dto: UpdateProfileDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) throw new NotFoundException('Employee not found');

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        firstName: dto.firstName ?? employee.firstName,
        lastName: dto.lastName ?? employee.lastName,
        username: dto.username ?? employee.username,
        phoneNumber: dto.phoneNumber ?? employee.phoneNumber,
        email: dto.email ?? employee.email,
      },
    });

    return this.getCurrentUser(employeeId);
  }

  async updateProfileImage(employeeId: string, filePath: string) {
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { profileImage: filePath },
    });

    return this.getCurrentUser(employeeId);
  }
}
