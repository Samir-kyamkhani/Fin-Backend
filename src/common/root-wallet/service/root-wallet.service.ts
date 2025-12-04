import { Injectable } from '@nestjs/common';
import { CreateRootWalletDto } from '../dto/create-root-wallet.dto.js';
import { UpdateRootWalletDto } from '../dto/update-root-wallet.dto.js';

@Injectable()
export class RootWalletService {
  create(createRootWalletDto: CreateRootWalletDto) {
    return 'This action adds a new rootWallet';
  }

  findAll() {
    return `This action returns all rootWallet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rootWallet`;
  }

  update(id: number, updateRootWalletDto: UpdateRootWalletDto) {
    return `This action updates a #${id} rootWallet`;
  }

  remove(id: number) {
    return `This action removes a #${id} rootWallet`;
  }
}
