import { Module } from '@nestjs/common';
import { DepartmentPermissionService } from './service/department-permission.service.js';

@Module({
  imports: [],
  providers: [DepartmentPermissionService],
  exports: [DepartmentPermissionService],
})
export class DepartmentPermissionModule {}
