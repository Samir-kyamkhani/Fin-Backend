import { Module } from '@nestjs/common';
import { SystemSettingService } from './service/system-setting.service'

@Module({
  providers: [SystemSettingService],
  exports: [SystemSettingService],
})
export class SystemSettingModule {}
