import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller.js';
import { UserService } from './services/user.service.js';
import { CommenUserService } from './services/common/common.user.service.js';
import { AuditLogModule } from '../common/audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  controllers: [UserController],
  providers: [UserService, CommenUserService],
  exports: [UserService, CommenUserService],
})
export class UserModule {}
