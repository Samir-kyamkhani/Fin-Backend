import { Module } from '@nestjs/common';
import { UserPermissionService } from './service/user-permission.service.js';

@Module({
  providers: [UserPermissionService],
  exports: [UserPermissionService],
})
export class UserPermissionModule {}
