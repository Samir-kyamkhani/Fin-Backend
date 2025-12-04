import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { LoginDto } from '../dto/login-auth.dto';
import { RefreshTokenDto } from '../dto/refresh-token-auth.dto';
import { ForgotPasswordDto } from '../dto/forgot-password-auth.dto';
import { ConfirmPasswordResetDto } from '../dto/confirm-password-reset-auth.dto';
import { UpdateCredentialsDto } from '../dto/update-credentials-auth.dto';
import { UpdateProfileDto } from '../dto/update-profile-auth.dto';
import { UserAuthService } from '../services/user.auth.service';

@Controller('users/auth')
export class EmployeeAuthController {
  constructor(private readonly authService: UserAuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  logout() {
    return this.authService.logout();
  }

  @Post('refresh-token')
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('request-password-reset')
  requestPasswordReset(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('confirm-password-reset')
  confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(dto);
  }

  @Get('current/:id')
  getCurrentUser(@Param('id') id: string) {
    return this.authService.getCurrentUser(+id);
  }

  @Get('dashboard/:id')
  getDashboard(@Param('id') id: string) {
    return this.authService.getDashboard(+id);
  }

  @Patch('credentials/:id')
  updateCredentials(
    @Param('id') id: string,
    @Body() dto: UpdateCredentialsDto,
  ) {
    return this.authService.updateCredentials(+id, dto);
  }

  @Patch('profile/:id')
  updateProfile(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(+id, dto);
  }

  @Patch('profile-image/:id')
  updateProfileImage(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfileImage(+id, dto);
  }
}
