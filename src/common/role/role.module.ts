import { Module } from '@nestjs/common';
import { RoleService } from './service/role.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Role } from './entities/role.entity';
import { CommissionSetting } from '../commission-setting/entities/commission-setting.entity';
import { RolePermission } from '../role-permission/entities/role-permission.entity';
import { User } from 'src/user/entities/user.entity';
import { Root } from 'src/root/entities/root.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Role,
      CommissionSetting,
      RolePermission,
      User,
      Root,
    ]),
  ],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
