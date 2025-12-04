import { Injectable } from '@nestjs/common';
import { CreateRootCommissionEarningDto } from '../dto/create-root-commission-earning.dto.js';
import { UpdateRootCommissionEarningDto } from '../dto/update-root-commission-earning.dto.js';

@Injectable()
export class RootCommissionEarningService {
  create(createRootCommissionEarningDto: CreateRootCommissionEarningDto) {
    return 'This action adds a new rootCommissionEarning';
  }

  findAll() {
    return `This action returns all rootCommissionEarning`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rootCommissionEarning`;
  }

  update(id: number, updateRootCommissionEarningDto: UpdateRootCommissionEarningDto) {
    return `This action updates a #${id} rootCommissionEarning`;
  }

  remove(id: number) {
    return `This action removes a #${id} rootCommissionEarning`;
  }
}
