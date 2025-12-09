import { Module } from '@nestjs/common';
import { CityService } from './service/city.service.js';
import { PrismaService } from '../../database/database.connection.js';

@Module({
  providers: [CityService, PrismaService],
  exports: [CityService],
})
export class CityModule {}
