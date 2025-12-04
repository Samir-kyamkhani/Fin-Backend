import { Module } from '@nestjs/common';
import { WalletService } from './service/wallet.service.js';

@Module({
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
