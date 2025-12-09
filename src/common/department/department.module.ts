import { Module } from '@nestjs/common';
import { DepartmentService } from './service/department.service'
@Module({
  imports: [],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
export class DepartmentModule {}
