import { Module } from '@nestjs/common';
import { PiiConsentService } from './service/pii-consent.service';

@Module({
  imports: [],
  providers: [PiiConsentService],
  exports: [PiiConsentService],
})
export class PiiConsentModule {}
