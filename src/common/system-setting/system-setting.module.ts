import { Module } from '@nestjs/common';
import { SystemSettingService } from './service/system-setting.service';

@Module({
  providers: [SystemSettingService],
})
export class SystemSettingModule {}
