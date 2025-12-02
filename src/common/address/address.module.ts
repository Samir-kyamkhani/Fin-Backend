import { Module } from '@nestjs/common';
import { AddressService } from './service/address.service';

@Module({
  providers: [AddressService],
})
export class AddressModule {}
