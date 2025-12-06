import { Module } from '@nestjs/common';
import { IpWhitelistService } from './service/ip-whitelist.service.js';
import { PrismaService } from '../../database/database.connection.js';
import { AuditLogService } from '../audit-log/service/audit-log.service.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  providers: [IpWhitelistService, PrismaService, AuditLogService],
  exports: [IpWhitelistService],
})
export class IpWhitelistModule {}
