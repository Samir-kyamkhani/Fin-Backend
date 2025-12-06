// src/auth/controllers/user-auth.controller.ts
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from '../dto/login-auth.dto'
import { ForgotPasswordDto } from '../dto/forgot-password-auth.dto'
import { ConfirmPasswordResetDto } from '../dto/confirm-password-reset-auth.dto'
import { UpdateCredentialsDto } from '../dto/update-credentials-auth.dto'
import { UpdateProfileDto } from '../dto/update-profile-auth.dto'
import { PermissionGuard } from '../guards/permission.guard'
import { RolesGuard } from '../guards/role.guard'
import { Roles } from '../decorators/roles.decorator'
import { Permissions } from '../decorators/permission.decorator'
import type { Request } from 'express';
import { AuthActor } from '../interface/auth.interface'
import { UserAuthService } from '../services/user.auth.service'
import { JwtAuthGuard } from '../guards/jwt.guard'

@Controller('/api/v1/users/auth')
export class UserAuthController {
  constructor(private readonly authService: UserAuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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

  // ROOT requirement: ADMIN can create employee from here
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('employees')
  createEmployee(@Req() req: Request, @Body() body: any) {
    const actor = req.user as AuthActor;
    return this.authService.createEmployeeByAdmin(actor.id, body);
  }
}
