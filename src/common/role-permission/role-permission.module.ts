import { Module } from '@nestjs/common';
import { RolePermissionService } from './service/role-permission.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { RolePermission } from './entities/role-permission.entity';
import { ServiceProvider } from '../service-provider/entities/service-provider.entity';
import { Role } from '../role/entities/role.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      RolePermission,
      ServiceProvider,
      Role,
      Root,
      User,
    ]),
  ],
  providers: [RolePermissionService],
  exports: [RolePermissionService],
})
export class RolePermissionModule {}
