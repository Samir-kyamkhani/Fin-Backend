import { Module } from '@nestjs/common';
import { AuditLogService } from './service/audit-log.service.js';
import { PrismaService } from '../../database/database.connection.js';
import { IpWhitelistService } from '../ip-whitelist/service/ip-whitelist.service.js';

@Module({
  imports: [],
  providers: [IpWhitelistService, AuditLogService, PrismaService],
  exports: [IpWhitelistService, AuditLogService],
})
export class AuditLogModule {}
