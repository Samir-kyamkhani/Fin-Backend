import { Module } from '@nestjs/common';
import { AuditLogService } from './service/audit-log.service'
import { PrismaService } from '../../database/database.connection'
import { IpWhitelistService } from '../ip-whitelist/service/ip-whitelist.service'

@Module({
  imports: [],
  providers: [IpWhitelistService, AuditLogService, PrismaService],
  exports: [IpWhitelistService, AuditLogService],
})
export class AuditLogModule {}
