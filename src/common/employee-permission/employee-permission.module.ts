import { Module } from '@nestjs/common';
import { EmployeePermissionService } from './service/employee-permission.service';

@Module({
  providers: [EmployeePermissionService],
})
export class EmployeePermissionModule {}
