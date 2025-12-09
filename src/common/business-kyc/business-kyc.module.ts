import { Module } from '@nestjs/common';
import { BusinessKycService } from './service/business-kyc.service.js';
import { PrismaService } from '../../database/database.connection.js';
import { UtilsModule } from '../../utils/utils.module.js';
import { AddressModule } from '../address/address.module.js';
import { PiiConsentModule } from '../pii-consent/pii-consent.module.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [UtilsModule, AddressModule, PiiConsentModule, AuditLogModule],
  providers: [BusinessKycService, PrismaService],
  exports: [BusinessKycService],
})
export class BusinessKycModule {}
