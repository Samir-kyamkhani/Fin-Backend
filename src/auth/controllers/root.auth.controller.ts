import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RefreshTokenDto } from '../dto/refresh-token-auth.dto.js';
import { ForgotPasswordDto } from '../dto/forgot-password-auth.dto.js';
import { ConfirmPasswordResetDto } from '../dto/confirm-password-reset-auth.dto.js';
import { UpdateCredentialsDto } from '../dto/update-credentials-auth.dto.js';
import { UpdateProfileDto } from '../dto/update-profile-auth.dto.js';
import { PermissionGuard } from '../guards/permission.guard.js';
import { RolesGuard } from '../guards/role.guard.js';
import { Roles } from '../decorators/roles.decorator.js';
import type { Request } from 'express';
import { AuthActor } from '../interface/auth.interface.js';
import { RootAuthService } from '../services/root.auth.service.js';
import { JwtAuthGuard } from '../guards/jwt.guard.js';
import { LoginDto } from '../dto/login-auth.dto.js';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/v1/root/auth')
export class RootAuthController {
  constructor(private readonly authService: RootAuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  @Post('refresh-token')
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refreshToken(dto, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: Request) {
    const actor = req.user as AuthActor;
    return this.authService.logout(actor.id, req);
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
  @Roles('ROOT')
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

  @UseGuards(JwtAuthGuard)
  @Patch('profile-image')
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateProfileImage(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const actor = req.user as AuthActor;
    return await this.authService.updateProfileImage(actor.id, file, req);
  }
}
