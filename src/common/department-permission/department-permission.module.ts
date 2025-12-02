import { Module } from '@nestjs/common';
import { DepartmentPermissionService } from './service/department-permission.service';

@Module({
  providers: [DepartmentPermissionService],
})
export class DepartmentPermissionModule {}
