import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { ApiEntity } from 'src/common/api-entity/entities/api-entity.entity';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { CommenUserService } from './services/common/common.user.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      // Role,
      // Wallet,
      // BankDetail,
      // UserKyc,
      // BusinessKyc,
      // Transaction,
      // CommissionEarning,
      // RootCommissionEarning,
      // UserPermission,
      // PiiConsent,
      ApiEntity,
      // IpWhitelist,
      // ServiceProvider,
      // Employee,
      // CommissionSetting,
      // Department,
    ]),
    // forwardRef(() => RolesModule),
    // MailModule,
    AuditLogModule,
    // PassportModule,
    // JwtModule.register({
    //   secret: process.env.JWT_SECRET || 'secret',
    //   signOptions: { expiresIn: '1h' },
    // }),
  ],
  controllers: [UserController],
  providers: [UserService, CommenUserService],
  exports: [UserService, CommenUserService, SequelizeModule],
})
export class UserModule {}
