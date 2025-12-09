import { Module } from '@nestjs/common';
import { AdminBusinessKYCController } from './controllers/admin.business-kyc.controller.js';
import { UserUserKYCController } from './controllers/user.user-kyc.controller.js';
import { AdminBusinessKYCService } from './services/admin-business-kyc.service.js';
import { UserUserKYCService } from './services/user.user-kyc.service.js';
import { BusinessKycModule } from '../common/business-kyc/business-kyc.module.js';
import { UserKycModule } from '../common/user-kyc/user-kyc.module.js';
import { AdminSystemSettingService } from './services/admin.system-setting.service.js';
import { AdminSystemSettingController } from './controllers/admin.system-setting.controller.js';
import { SystemSettingModule } from '../common/system-setting/system-setting.module.js';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { CommenUserService } from './services/common/common.user.service';
import { AuditLogModule } from '../common/audit-log/audit-log.module';

@Module({
  imports: [
    AuditLogModule,
    UserKycModule,
    BusinessKycModule,
    SystemSettingModule,
  ],
  controllers: [
    UserController,
    AdminBusinessKYCController,
    UserUserKYCController,
    AdminSystemSettingController,
  ],
  providers: [
    UserService,
    CommenUserService,
    AdminBusinessKYCService,
    UserUserKYCService,
    AdminSystemSettingService,
  ],
  exports: [
    UserService,
    CommenUserService,
    AdminBusinessKYCService,
    UserUserKYCService,
    AdminSystemSettingService,
  ],
})
export class UserModule {}
