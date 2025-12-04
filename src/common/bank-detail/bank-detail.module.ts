import { Module } from '@nestjs/common';
import { BankDetailService } from './service/bank-detail.service.js';
@Module({
  imports: [],
  providers: [BankDetailService],
  exports: [BankDetailService],
})
export class BankDetailModule {}
