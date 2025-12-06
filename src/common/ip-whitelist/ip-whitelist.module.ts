import { Module } from '@nestjs/common';
import { IpWhitelistService } from './service/ip-whitelist.service'
import { PrismaService } from '../../database/database.connection'
import { AuditLogService } from '../audit-log/service/audit-log.service'
import { AuditLogModule } from '../audit-log/audit-log.module'

@Module({
  imports: [AuditLogModule],
  providers: [IpWhitelistService, PrismaService, AuditLogService],
  exports: [IpWhitelistService],
})
export class IpWhitelistModule {}
