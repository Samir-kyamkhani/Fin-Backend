import { Module } from '@nestjs/common';
import { ApiIntigrationService } from './service/api-intigration.service';

@Module({
  providers: [ApiIntigrationService],
})
export class ApiIntigrationModule {}
