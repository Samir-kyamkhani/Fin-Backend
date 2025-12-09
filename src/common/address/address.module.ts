import { Module } from '@nestjs/common';
import { AddressService } from './service/address.service.js';
import { PrismaService } from '../../database/database.connection.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { CityModule } from '../city/city.module.js';
import { StateModule } from '../state/state.module.js';

@Module({
  imports: [AuditLogModule, CityModule, StateModule],
  providers: [AddressService, PrismaService],
  exports: [AddressService],
})
export class AddressModule {}
