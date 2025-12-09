import { Module } from '@nestjs/common';
import { RootUserKYCService } from './services/root.user-kyc.service.js';
import { RootBusinessKYCService } from './services/root.business-kyc.service.js';
import { RootBusinessKYCController } from './controllers/root.business-kyc.controller.js';
import { RootUserKYCController } from './controllers/root.user-kyc.controller.js';
import { UserKycModule } from '../common/user-kyc/user-kyc.module.js';
import { BusinessKycModule } from '../common/business-kyc/business-kyc.module.js';
import { PrismaService } from '../database/database.connection.js';
import { SystemSettingModule } from '../common/system-setting/system-setting.module.js';
import { RootSystemSettingController } from './controllers/root.system-setting.controller.js';
import { RootSystemSettingService } from './services/root.system-setting.service.js';
import { RootService } from './services/root.service';
import { RootController } from './controllers/root.controller';
import { AuditLogModule } from '../common/audit-log/audit-log.module';

@Module({
  imports: [
    AuditLogModule,
    UserKycModule,
    BusinessKycModule,
    SystemSettingModule,
  ],
  controllers: [
    RootController,
    RootUserKYCController,
    RootBusinessKYCController,
    RootSystemSettingController,
  ],
  providers: [
    PrismaService,
    RootService,
    RootUserKYCService,
    RootBusinessKYCService,
    RootSystemSettingService,
  ],
  exports: [
    RootService,
    RootUserKYCService,
    RootBusinessKYCService,
    RootSystemSettingService,
  ],
})
export class RootModule {}
