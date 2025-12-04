import { Module } from '@nestjs/common';
import { RootCommissionEarningService } from './service/root-commission-earning.service.js';

@Module({
  providers: [RootCommissionEarningService],
  exports: [RootCommissionEarningService],
})
export class RootCommissionEarningModule {}
