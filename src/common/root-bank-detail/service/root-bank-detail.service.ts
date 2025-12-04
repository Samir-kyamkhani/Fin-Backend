import { Injectable } from '@nestjs/common';
import { CreateRootBankDetailDto } from '../dto/create-root-bank-detail.dto.js';
import { UpdateRootBankDetailDto } from '../dto/update-root-bank-detail.dto.js';

@Injectable()
export class RootBankDetailService {
  create(createRootBankDetailDto: CreateRootBankDetailDto) {
    return 'This action adds a new rootBankDetail';
  }

  findAll() {
    return `This action returns all rootBankDetail`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rootBankDetail`;
  }

  update(id: number, updateRootBankDetailDto: UpdateRootBankDetailDto) {
    return `This action updates a #${id} rootBankDetail`;
  }

  remove(id: number) {
    return `This action removes a #${id} rootBankDetail`;
  }
}
