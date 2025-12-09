import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import type { Request, Response, CookieOptions } from 'express';

import { ForgotPasswordDto } from '../dto/forgot-password-auth.dto';
import { ConfirmPasswordResetDto } from '../dto/confirm-password-reset-auth.dto';
import { UpdateCredentialsDto } from '../dto/update-credentials-auth.dto';
import { UpdateProfileDto } from '../dto/update-profile-auth.dto';
import { LoginDto } from '../dto/login-auth.dto';

import { PermissionGuard } from '../guards/permission.guard';
import { RolesGuard } from '../guards/role.guard';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt.guard';

import type { AuthActor } from '../interface/auth.interface';
import { RootAuthService } from '../services/root.auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Controller('api/v1/root/auth')
export class RootAuthController {
  private readonly accessTokenCookieOptions: CookieOptions;
  private readonly refreshTokenCookieOptions: CookieOptions;

  private static readonly ACCESS_TOKEN_COOKIE_NAME = 'access_token';
  private static readonly REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

  constructor(
    private readonly authService: RootAuthService,
    private readonly configService: ConfigService,
  ) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    const baseCookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/',
    };

    this.accessTokenCookieOptions = {
      ...baseCookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day
    };

    this.refreshTokenCookieOptions = {
      ...baseCookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    };
  }

  private setAuthCookies(res: Response, tokens: AuthTokens): void {
    res.cookie(
      RootAuthController.ACCESS_TOKEN_COOKIE_NAME,
      tokens.accessToken,
      this.accessTokenCookieOptions,
    );

    res.cookie(
      RootAuthController.REFRESH_TOKEN_COOKIE_NAME,
      tokens.refreshToken,
      this.refreshTokenCookieOptions,
    );
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(RootAuthController.ACCESS_TOKEN_COOKIE_NAME, {
      path: '/',
    });

    res.clearCookie(RootAuthController.REFRESH_TOKEN_COOKIE_NAME, {
      path: '/',
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    const result = await this.authService.login(dto, req);

    this.setAuthCookies(res, result.tokens);

    return { success: true };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    const refreshToken = req.cookies?.[
      RootAuthController.REFRESH_TOKEN_COOKIE_NAME
    ] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const result = await this.authService.refreshToken(refreshToken, req);

    this.setAuthCookies(res, result.tokens);

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @CurrentUser() user: AuthActor,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    if (!user) {
      throw new UnauthorizedException();
    }

    this.clearAuthCookies(res);

    await this.authService.logout(user.id, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-password-reset')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestPasswordReset(
    @CurrentUser() user: AuthActor,
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ success: true; message: string }> {
    const result = await this.authService.requestPasswordReset(dto, user);
    return { success: true, message: result.message };
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm-password-reset')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordReset(
    @CurrentUser() user: AuthActor,
    @Body() dto: ConfirmPasswordResetDto,
  ): Promise<{ success: true; message: string }> {
    const result = await this.authService.confirmPasswordReset(dto, user);
    return { success: true, message: result.message };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: AuthActor) {
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.authService.getCurrentUser(user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
  @Roles('ROOT')
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AuthActor) {
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.authService.getDashboard(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('credentials')
  async updateCredentials(
    @CurrentUser() user: AuthActor,
    @Body() dto: UpdateCredentialsDto,
  ) {
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.authService.updateCredentials(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AuthActor,
    @Body() dto: UpdateProfileDto,
  ) {
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.authService.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile-image')
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateProfileImage(
    @Req() req: Request,
    @CurrentUser() user: AuthActor,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // 5 MB max; adjust to your needs
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          // basic check; you may want a stricter custom validator
          new FileTypeValidator({
            fileType: /^(image\/jpeg|image\/png|image\/webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!user) {
      throw new UnauthorizedException();
    }

    if (!file) {
      throw new BadRequestException('profileImage file is required');
    }

    return this.authService.updateProfileImage(user.id, file, req);
  }
}
