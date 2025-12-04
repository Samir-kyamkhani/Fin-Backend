import { Module } from '@nestjs/common';
import { AuditLogService } from './service/audit-log.service.js';
import { PrismaService } from '../../database/database.connection.js';

@Module({
  imports: [],
  providers: [AuditLogService, PrismaService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
