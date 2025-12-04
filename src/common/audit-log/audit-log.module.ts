import { Module } from '@nestjs/common';
import { AuditLogService } from './service/audit-log.service';

@Module({
  imports: [],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
