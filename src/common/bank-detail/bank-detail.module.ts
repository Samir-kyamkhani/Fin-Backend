import { Module } from '@nestjs/common';
import { BankDetailService } from './service/bank-detail.service';

@Module({
  providers: [BankDetailService],
})
export class BankDetailModule {}
