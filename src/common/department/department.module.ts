import { Module } from '@nestjs/common';
import { DepartmentService } from './service/department.service.js';
@Module({
  imports: [],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
export class DepartmentModule {}
