import { Module } from '@nestjs/common';
import { CommissionSettingService } from './service/commission-setting.service'
@Module({
  imports: [],
  providers: [CommissionSettingService],
  exports: [CommissionSettingService],
})
export class CommissionSettingModule {}
