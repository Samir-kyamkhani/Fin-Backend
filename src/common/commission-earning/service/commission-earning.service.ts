import { Injectable } from '@nestjs/common';
import { CreateCommissionEarningDto } from '../dto/create-commission-earning.dto';
import { UpdateCommissionEarningDto } from '../dto/update-commission-earning.dto';

@Injectable()
export class CommissionEarningService {
  create(createCommissionEarningDto: CreateCommissionEarningDto) {
    return 'This action adds a new commissionEarning';
  }

  findAll() {
    return `This action returns all commissionEarning`;
  }

  findOne(id: number) {
    return `This action returns a #${id} commissionEarning`;
  }

  update(id: number, updateCommissionEarningDto: UpdateCommissionEarningDto) {
    return `This action updates a #${id} commissionEarning`;
  }

  remove(id: number) {
    return `This action removes a #${id} commissionEarning`;
  }
}
