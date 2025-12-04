import { Module } from '@nestjs/common';
import { BusinessKycService } from './service/business-kyc.service.js';

@Module({
  imports: [],
  providers: [BusinessKycService],
  exports: [BusinessKycService],
})
export class BusinessKycModule {}
