import { Module } from '@nestjs/common';
import { RootService } from './services/root.service'
import { RootController } from './controllers/root.controller'
import { AuditLogModule } from '../common/audit-log/audit-log.module'

@Module({
  imports: [AuditLogModule],
  controllers: [RootController],
  providers: [RootService],
  exports: [RootService],
})
export class RootModule {}
