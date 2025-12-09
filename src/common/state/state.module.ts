import { Module } from '@nestjs/common';
import { StateService } from './service/state.service.js';
import { PrismaService } from '../../database/database.connection.js';

@Module({
  providers: [StateService, PrismaService],
  exports: [StateService],
})
export class StateModule {}
