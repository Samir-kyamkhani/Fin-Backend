import { Module } from '@nestjs/common';
import { ServiceProviderService } from './service/service-provider.service';

@Module({
  providers: [ServiceProviderService],
})
export class ServiceProviderModule {}
