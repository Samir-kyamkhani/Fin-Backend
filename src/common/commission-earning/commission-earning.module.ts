import { Module } from '@nestjs/common';
import { CommissionEarningService } from './service/commission-earning.service';

@Module({
  providers: [CommissionEarningService],
})
export class CommissionEarningModule {}
