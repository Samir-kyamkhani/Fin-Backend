import { Module } from '@nestjs/common';
import { EmployeePermissionService } from './service/employee-permission.service';

@Module({
  imports: [],
  providers: [EmployeePermissionService],
  exports: [EmployeePermissionService],
})
export class EmployeePermissionModule {}
