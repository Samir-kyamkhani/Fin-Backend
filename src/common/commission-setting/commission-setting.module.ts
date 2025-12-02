import { Module } from '@nestjs/common';
import { CommissionSettingService } from './service/commission-setting.service';

@Module({
  providers: [CommissionSettingService],
})
export class CommissionSettingModule {}
