import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtStrategy } from './strategies/jwt.strategy'

import { PermissionGuard } from './guards/permission.guard'
import { RolesGuard } from './guards/role.guard'

import { RootAuthService } from './services/root.auth.service'
import { UserAuthService } from './services/user.auth.service'
import { EmployeeAuthService } from './services/employee.auth.service'

import { PrismaService } from '../database/database.connection'
import { AuthUtilsService } from './helper/auth-utils'

import { EmailService } from './email/email.service'
import { S3Service } from '../utils/s3/s3.service'

import { IpWhitelistService } from '../common/ip-whitelist/service/ip-whitelist.service'
import { IpWhitelistModule } from '../common/ip-whitelist/ip-whitelist.module'

import { UtilsModule } from '../utils/utils.module'
import { AuditLogModule } from '../common/audit-log/audit-log.module'

import { RootAuthController } from './controllers/root.auth.controller'

import { ConfigService } from '@nestjs/config';
import { PermissionService } from './permission-registry/permission.service'
import { IdentityProvider } from './strategies/identity.provider'
import { AuditLogService } from '../common/audit-log/service/audit-log.service'

@Module({
  imports: [
    CacheModule.register({
      ttl: 5 * 60 * 1000,
      isGlobal: true,
    }),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('security.jwtSecret'),
        signOptions: { expiresIn: '1h' },
      }),
    }),

    IpWhitelistModule,
    UtilsModule,
    AuditLogModule,
  ],

  providers: [
    PrismaService,

    // Auth core services
    RootAuthService,
    UserAuthService,
    EmployeeAuthService,

    // JWT + identity
    JwtStrategy,
    IdentityProvider,

    // Permissions
    PermissionService,
    PermissionGuard,
    RolesGuard,

    // Utils
    AuthUtilsService,
    EmailService,
    S3Service,

    IpWhitelistService,
    AuditLogService,
  ],

  controllers: [RootAuthController],

  exports: [
    RootAuthService,
    UserAuthService,
    EmployeeAuthService,
    PermissionService,
    PermissionGuard,
    RolesGuard,
    JwtModule,
    AuthUtilsService,
  ],
})
export class AuthModule {}
