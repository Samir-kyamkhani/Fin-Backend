import { Module } from '@nestjs/common';
import { RootCommissionEarningService } from './service/root-commission-earning.service';

@Module({
  providers: [RootCommissionEarningService],
})
export class RootCommissionEarningModule {}
