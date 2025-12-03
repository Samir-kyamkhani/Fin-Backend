import { Module, forwardRef } from '@nestjs/common';
import { EmployeeService } from './services/employee.service';
import { EmployeeController } from './controllers/employee.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Employee } from './entities/employee.entity';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';
import { Department } from 'src/common/department/entities/department.entity';
import { EmployeePermission } from 'src/common/employee-permission/entities/employee-permission.entity';
import { DepartmentModule } from 'src/common/department/department.module';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Employee,
      Department,
      Root,
      User,
      EmployeePermission,
    ]),
    forwardRef(() => DepartmentModule),
    AuditLogModule,
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService, SequelizeModule],
})
export class EmployeeModule {}
