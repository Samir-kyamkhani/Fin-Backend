import { Module } from '@nestjs/common';
import { DepartmentPermissionService } from './service/department-permission.service'

@Module({
  imports: [],
  providers: [DepartmentPermissionService],
  exports: [DepartmentPermissionService],
})
export class DepartmentPermissionModule {}
