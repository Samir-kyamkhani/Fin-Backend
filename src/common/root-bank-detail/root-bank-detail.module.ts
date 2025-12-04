import { Module } from '@nestjs/common';
import { RootBankDetailService } from './service/root-bank-detail.service.js';

@Module({
  providers: [RootBankDetailService],
  exports: [RootBankDetailService],
})
export class RootBankDetailModule {}
