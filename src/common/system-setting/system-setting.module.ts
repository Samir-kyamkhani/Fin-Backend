import { Module } from '@nestjs/common';
import { SystemSettingService } from './service/system-setting.service.js';
import { PrismaService } from '../../database/database.connection.js';
import { UtilsModule } from '../../utils/utils.module.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [UtilsModule, AuditLogModule],
  providers: [SystemSettingService, PrismaService],
  exports: [SystemSettingService],
})
export class SystemSettingModule {}
