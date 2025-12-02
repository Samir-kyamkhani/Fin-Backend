import { Module } from '@nestjs/common';
import { RolePermissionService } from './service/role-permission.service';

@Module({
  providers: [RolePermissionService],
})
export class RolePermissionModule {}
