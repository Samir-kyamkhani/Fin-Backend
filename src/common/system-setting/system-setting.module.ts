import { Module } from '@nestjs/common';
import { SystemSettingService } from './service/system-setting.service.js';

@Module({
  providers: [SystemSettingService],
  exports: [SystemSettingService],
})
export class SystemSettingModule {}
