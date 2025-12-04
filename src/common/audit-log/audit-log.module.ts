import { Module } from '@nestjs/common';
import { AuditLogService } from './service/audit-log.service';
import { PrismaService } from '../../database/database.connection';

@Module({
  imports: [],
  providers: [AuditLogService, PrismaService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
