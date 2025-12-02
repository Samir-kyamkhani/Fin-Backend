import { Module } from '@nestjs/common';
import { StateService } from './service/state.service';

@Module({
  providers: [StateService],
})
export class StateModule {}
