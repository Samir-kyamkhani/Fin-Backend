// src/auth/controllers/employee-auth.controller.ts
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from '../dto/login-auth.dto.js';
import { RefreshTokenDto } from '../dto/refresh-token-auth.dto.js';
import { ForgotPasswordDto } from '../dto/forgot-password-auth.dto.js';
import { ConfirmPasswordResetDto } from '../dto/confirm-password-reset-auth.dto.js';
import { UpdateCredentialsDto } from '../dto/update-credentials-auth.dto.js';
import { UpdateProfileDto } from '../dto/update-profile-auth.dto.js';
import { PermissionGuard } from '../guards/permission.guard.js';
import { RolesGuard } from '../guards/role.guard.js';
import type { Request } from 'express';
import { AuthActor } from '../types/principal.type.js';
import { EmployeeAuthService } from '../services/employee.auth.service.js';
import { JwtAuthGuard } from '../guards/jwt.guard.js';

@Controller('/api/v1/employee/auth')
export class EmployeeAuthController {
  constructor(private readonly authService: EmployeeAuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh-token')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: Request) {
    const actor = req.user as AuthActor;
    return this.authService.logout(actor.id);
  }

  @Post('request-password-reset')
  requestPasswordReset(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('confirm-password-reset')
  confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: Request) {
    const actor = req.user as AuthActor;
    return this.authService.getCurrentUser(actor.id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
  @Get('dashboard')
  getDashboard(@Req() req: Request) {
    const actor = req.user as AuthActor;
    return this.authService.getDashboard(actor.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('credentials')
  updateCredentials(@Req() req: Request, @Body() dto: UpdateCredentialsDto) {
    const actor = req.user as AuthActor;
    return this.authService.updateCredentials(actor.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const actor = req.user as AuthActor;
    return this.authService.updateProfile(actor.id, dto);
  }
}
