import { Module } from '@nestjs/common';
import { RootWalletService } from './service/root-wallet.service';

@Module({
  providers: [RootWalletService],
})
export class RootWalletModule {}
