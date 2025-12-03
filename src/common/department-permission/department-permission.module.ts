import { Module } from '@nestjs/common';
import { DepartmentPermissionService } from './service/department-permission.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { DepartmentPermission } from './entities/department-permission.entity';
import { User } from 'src/user/entities/user.entity';
import { Root } from 'src/root/entities/root.entity';
import { Department } from '../department/entities/department.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([DepartmentPermission, User, Root, Department]),
  ],
  providers: [DepartmentPermissionService],
  exports: [DepartmentPermissionService],
})
export class DepartmentPermissionModule {}
