import { Module } from '@nestjs/common';
import { UserKycService } from './service/user-kyc.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserKyc } from './entities/user-kyc.entity';
import { User } from 'src/user/entities/user.entity';
import { Root } from 'src/root/entities/root.entity';
import { PiiConsent } from '../pii-consent/entities/pii-consent.entity';
import { BusinessKyc } from '../business-kyc/entities/business-kyc.entity';
import { Address } from '../address/entities/address.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      UserKyc,
      User,
      Root,
      PiiConsent,
      BusinessKyc,
      Address,
    ]),
  ],
  providers: [UserKycService],
  exports: [UserKycService],
})
export class UserKycModule {}
