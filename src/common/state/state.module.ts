import { Module } from '@nestjs/common';
import { StateService } from './service/state.service'

@Module({
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}
