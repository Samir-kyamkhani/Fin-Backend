import { Module } from '@nestjs/common';
import { PiiConsentService } from './service/pii-consent.service';

@Module({
  providers: [PiiConsentService],
})
export class PiiConsentModule {}
