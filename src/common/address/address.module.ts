import { Module } from '@nestjs/common';
import { AddressService } from './service/address.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Address } from './entities/address.entity';
import { BusinessKyc } from '../business-kyc/entities/business-kyc.entity';
import { City } from '../city/entities/city.entity';
import { State } from '../state/entities/state.entity';
import { UserKyc } from '../user-kyc/entities/user-kyc.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([Address, BusinessKyc, City, State, UserKyc]),
  ],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
