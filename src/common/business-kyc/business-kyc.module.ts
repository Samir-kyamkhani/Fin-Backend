import { Module } from '@nestjs/common';
import { BusinessKycService } from './service/business-kyc.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { BusinessKyc } from './entities/business-kyc.entity';
import { Address } from '../address/entities/address.entity';
import { PiiConsent } from '../pii-consent/entities/pii-consent.entity';
import { UserKyc } from '../user-kyc/entities/user-kyc.entity';
import { Employee } from 'src/employee/entities/employee.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      BusinessKyc,
      Address,
      PiiConsent,
      UserKyc,
      Employee,
      Root,
      User,
    ]),
  ],
  providers: [BusinessKycService],
  exports: [BusinessKycService],
})
export class BusinessKycModule {}
