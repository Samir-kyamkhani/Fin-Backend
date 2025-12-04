import { Module } from '@nestjs/common';
import { EmployeeService } from './services/employee.service.js';
import { EmployeeController } from './controllers/employee.controller.js';
import { AuditLogModule } from '../common/audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
