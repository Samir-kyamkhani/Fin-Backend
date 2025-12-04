import { Module } from '@nestjs/common';
import { EmployeeService } from './services/employee.service';
import { EmployeeController } from './controllers/employee.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditLogModule } from '../common/audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService, SequelizeModule],
})
export class EmployeeModule {}
