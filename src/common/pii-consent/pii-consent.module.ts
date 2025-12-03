import { Module } from '@nestjs/common';
import { PiiConsentService } from './service/pii-consent.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { PiiConsent } from './entities/pii-consent.entity';
import { User } from 'src/user/entities/user.entity';
import { UserKyc } from '../user-kyc/entities/user-kyc.entity';
import { BusinessKyc } from '../business-kyc/entities/business-kyc.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([PiiConsent, User, UserKyc, BusinessKyc]),
  ],
  providers: [PiiConsentService],
  exports: [PiiConsentService],
})
export class PiiConsentModule {}
