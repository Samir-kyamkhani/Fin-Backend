import { Module } from '@nestjs/common';
import { CityService } from './service/city.service'

@Module({
  imports: [],
  providers: [CityService],
  exports: [CityService],
})
export class CityModule {}
