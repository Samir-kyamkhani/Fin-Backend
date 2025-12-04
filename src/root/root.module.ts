import { Module } from '@nestjs/common';
import { RootService } from './services/root.service.js';
import { RootController } from './controllers/root.controller.js';
import { AuditLogModule } from '../common/audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  controllers: [RootController],
  providers: [RootService],
  exports: [RootService],
})
export class RootModule {}
