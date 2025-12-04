import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { CommenUserService } from './services/common/common.user.service';
import { AuditLogModule } from '../common/audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [UserController],
  providers: [UserService, CommenUserService],
  exports: [UserService, CommenUserService],
})
export class UserModule {}
