import { Module } from '@nestjs/common';
import { CommissionSettingService } from './service/commission-setting.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommissionSetting } from './entities/commission-setting.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';
import { ServiceProvider } from '../service-provider/entities/service-provider.entity';
import { Role } from '../role/entities/role.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      CommissionSetting,
      Root,
      User,
      ServiceProvider,
      Role,
    ]),
  ],
  providers: [CommissionSettingService],
  exports: [CommissionSettingService],
})
export class CommissionSettingModule {}
