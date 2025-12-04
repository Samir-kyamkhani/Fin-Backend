import { Module } from '@nestjs/common';
import { CityService } from './service/city.service.js';

@Module({
  imports: [],
  providers: [CityService],
  exports: [CityService],
})
export class CityModule {}
