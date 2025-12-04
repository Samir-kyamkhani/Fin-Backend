import { Injectable } from '@nestjs/common';
import { CreateWalletDto } from '../dto/create-wallet.dto.js';
import { UpdateWalletDto } from '../dto/update-wallet.dto.js';

@Injectable()
export class WalletService {
  create(createWalletDto: CreateWalletDto) {
    return 'This action adds a new wallet';
  }

  findAll() {
    return `This action returns all wallet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} wallet`;
  }

  update(id: number, updateWalletDto: UpdateWalletDto) {
    return `This action updates a #${id} wallet`;
  }

  remove(id: number) {
    return `This action removes a #${id} wallet`;
  }
}
