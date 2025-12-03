import { Module } from '@nestjs/common';
import { UserPermissionService } from './service/user-permission.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserPermission } from './entities/user-permission.entity';
import { ServiceProvider } from '../service-provider/entities/service-provider.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([UserPermission, ServiceProvider, Root, User]),
  ],
  providers: [UserPermissionService],
  exports: [UserPermissionService],
})
export class UserPermissionModule {}
