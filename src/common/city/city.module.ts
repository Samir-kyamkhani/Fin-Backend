import { Module } from '@nestjs/common';
import { CityService } from './service/city.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { City } from './entities/city.entity';
import { Address } from '../address/entities/address.entity';

@Module({
  imports: [SequelizeModule.forFeature([City, Address])],
  providers: [CityService],
  exports: [CityService],
})
export class CityModule {}
