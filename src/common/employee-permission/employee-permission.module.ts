import { Module } from '@nestjs/common';
import { EmployeePermissionService } from './service/employee-permission.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { EmployeePermission } from './entities/employee-permission.entity';
import { User } from 'src/user/entities/user.entity';
import { Root } from 'src/root/entities/root.entity';
import { Employee } from 'src/employee/entities/employee.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([EmployeePermission, User, Root, Employee]),
  ],
  providers: [EmployeePermissionService],
  exports: [EmployeePermissionService],
})
export class EmployeePermissionModule {}
