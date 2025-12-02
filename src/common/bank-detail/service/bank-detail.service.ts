import { Injectable } from '@nestjs/common';
import { CreateBankDetailDto } from '../dto/create-bank-detail.dto';
import { UpdateBankDetailDto } from '../dto/update-bank-detail.dto';

@Injectable()
export class BankDetailService {
  create(createBankDetailDto: CreateBankDetailDto) {
    return 'This action adds a new bankDetail';
  }

  findAll() {
    return `This action returns all bankDetail`;
  }

  findOne(id: number) {
    return `This action returns a #${id} bankDetail`;
  }

  update(id: number, updateBankDetailDto: UpdateBankDetailDto) {
    return `This action updates a #${id} bankDetail`;
  }

  remove(id: number) {
    return `This action removes a #${id} bankDetail`;
  }
}
