import { Module } from '@nestjs/common';
import { CityService } from './service/city.service';

@Module({
  providers: [CityService],
})
export class CityModule {}
