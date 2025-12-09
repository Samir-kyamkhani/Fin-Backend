import { Injectable } from '@nestjs/common';
import { CreateRefundDto } from '../dto/create-refund.dto'
import { UpdateRefundDto } from '../dto/update-refund.dto'

@Injectable()
export class RefundService {
  create(createRefundDto: CreateRefundDto) {
    return 'This action adds a new refund';
  }

  findAll() {
    return `This action returns all refund`;
  }

  findOne(id: number) {
    return `This action returns a #${id} refund`;
  }

  update(id: number, updateRefundDto: UpdateRefundDto) {
    return `This action updates a #${id} refund`;
  }

  remove(id: number) {
    return `This action removes a #${id} refund`;
  }
}
