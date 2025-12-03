import { Module } from '@nestjs/common';
import { DepartmentService } from './service/department.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Department } from './entities/department.entity';
import { User } from 'src/user/entities/user.entity';
import { Root } from 'src/root/entities/root.entity';
import { Employee } from 'src/employee/entities/employee.entity';
import { DepartmentPermission } from '../department-permission/entities/department-permission.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Department,
      User,
      Root,
      Employee,
      DepartmentPermission,
    ]),
  ],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
export class DepartmentModule {}
