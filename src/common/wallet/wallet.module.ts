import { Module } from '@nestjs/common';
import { WalletService } from './service/wallet.service'

@Module({
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
