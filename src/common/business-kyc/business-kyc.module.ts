import { Module } from '@nestjs/common';
import { BusinessKycService } from './service/business-kyc.service';

@Module({
  providers: [BusinessKycService],
})
export class BusinessKycModule {}
