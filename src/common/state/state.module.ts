import { Module } from '@nestjs/common';
import { StateService } from './service/state.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { State } from './entities/state.entity';
import { Address } from '../address/entities/address.entity';
import { City } from '../city/entities/city.entity';

@Module({
  imports: [SequelizeModule.forFeature([State, Address, City])],
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}
