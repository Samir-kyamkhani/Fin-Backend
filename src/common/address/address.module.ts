import { Module } from '@nestjs/common';
import { AddressService } from './service/address.service.js';

@Module({
  imports: [],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
