import { Module } from '@nestjs/common';
import { StateService } from './service/state.service.js';

@Module({
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}
