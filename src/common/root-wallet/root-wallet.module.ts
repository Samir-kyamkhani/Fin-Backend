import { Module } from '@nestjs/common';
import { RootWalletService } from './service/root-wallet.service.js';

@Module({
  providers: [RootWalletService],
  exports: [RootWalletService],
})
export class RootWalletModule {}
