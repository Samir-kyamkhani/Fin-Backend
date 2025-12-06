import { Module } from '@nestjs/common';
import { UserKycService } from './service/user-kyc.service'

@Module({
  providers: [UserKycService],
  exports: [UserKycService],
})
export class UserKycModule {}
