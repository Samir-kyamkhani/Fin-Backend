import { Module } from '@nestjs/common';
import { BusinessKycService } from './business-kyc.service';
import { BusinessKycController } from './business-kyc.controller';

@Module({
  controllers: [BusinessKycController],
  providers: [BusinessKycService],
})
export class BusinessKycModule {}
