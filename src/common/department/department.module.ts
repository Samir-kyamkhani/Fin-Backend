import { Module } from '@nestjs/common';
import { DepartmentService } from './service/department.service';

@Module({
  providers: [DepartmentService],
})
export class DepartmentModule {}
