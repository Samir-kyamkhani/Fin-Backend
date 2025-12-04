import { Module } from '@nestjs/common';
import { UserPermissionService } from './service/user-permission.service';

@Module({
  providers: [UserPermissionService],
  exports: [UserPermissionService],
})
export class UserPermissionModule {}
