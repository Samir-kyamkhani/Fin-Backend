import { Module } from '@nestjs/common';
import { CommissionEarningService } from './service/commission-earning.service.js';

@Module({
  imports: [],
  providers: [CommissionEarningService],
  exports: [CommissionEarningService],
})
export class CommissionEarningModule {}
