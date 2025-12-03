import { Module } from '@nestjs/common';
import { SystemSettingService } from './service/system-setting.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { SystemSetting } from './entities/system-setting.entity';
import { Root } from 'src/root/entities/root.entity';

@Module({
  imports: [SequelizeModule.forFeature([SystemSetting, Root])],
  providers: [SystemSettingService],
  exports: [SystemSettingService],
})
export class SystemSettingModule {}
