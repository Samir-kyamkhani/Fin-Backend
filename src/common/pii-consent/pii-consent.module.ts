import { Module } from '@nestjs/common';
import { PiiConsentService } from './service/pii-consent.service.js';
import { PrismaService } from '../../database/database.connection.js';
import { UtilsModule } from '../../utils/utils.module.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule, UtilsModule],
  providers: [PiiConsentService, PrismaService],
  exports: [PiiConsentService],
})
export class PiiConsentModule {}
