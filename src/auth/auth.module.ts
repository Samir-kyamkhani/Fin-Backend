import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { PermissionGuard } from './guards/permission.guard.js';
import { RootAuthService } from './services/root.auth.service.js';
import { PermissionService } from './permission-registry/permission.service.js';
import { RolesGuard } from './guards/role.guard.js';
import { EmployeeAuthService } from './services/employee.auth.service.js';
import { UserAuthService } from './services/user.auth.service.js';
import { PrismaService } from '../database/database.connection.js';
import { AuthUtilsService } from './helper/auth-utils.js';
import { EmailService } from './email/email.service.js';
import { S3Service } from '../utils/s3/s3.service.js';
import { IpWhitelistService } from '../common/ip-whitelist/service/ip-whitelist.service.js';
import { IpWhitelistModule } from '../common/ip-whitelist/ip-whitelist.module.js';
import { UtilsModule } from '../utils/utils.module.js';
import { AuditLogModule } from '../common/audit-log/audit-log.module.js';
import { AuditLogService } from '../common/audit-log/service/audit-log.service.js';
import { RootAuthController } from './controllers/root.auth.controller.js';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300000, // 5 mins
      isGlobal: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    IpWhitelistModule,
    UtilsModule,
    AuditLogModule,
  ],
  providers: [
    PrismaService,
    RootAuthService,
    UserAuthService,
    EmployeeAuthService,
    JwtStrategy,
    PermissionService,
    PermissionGuard,
    RolesGuard,
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
