import { Module } from '@nestjs/common';
import { UserKycService } from './service/user-kyc.service.js';
import { PrismaService } from '../../database/database.connection.js';
import { UtilsModule } from '../../utils/utils.module.js';
import { AddressModule } from '../address/address.module.js';
import { PiiConsentModule } from '../pii-consent/pii-consent.module.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [UtilsModule, AddressModule, PiiConsentModule, AuditLogModule],
  providers: [UserKycService, PrismaService],
  exports: [UserKycService],
})
export class UserKycModule {}
