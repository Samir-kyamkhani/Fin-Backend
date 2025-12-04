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

@Module({
  imports: [
    CacheModule.register({
      ttl: 300000, // 5 mins
      isGlobal: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET!,
      signOptions: { expiresIn: '1h' },
    }),
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
  ],
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
