import { Injectable } from '@nestjs/common';
import { CreateCommissionSettingDto } from '../dto/create-commission-setting.dto'
import { UpdateCommissionSettingDto } from '../dto/update-commission-setting.dto'

@Injectable()
export class CommissionSettingService {
  create(createCommissionSettingDto: CreateCommissionSettingDto) {
    return 'This action adds a new commissionSetting';
  }

  findAll() {
    return `This action returns all commissionSetting`;
  }

  findOne(id: number) {
    return `This action returns a #${id} commissionSetting`;
  }

  update(id: number, updateCommissionSettingDto: UpdateCommissionSettingDto) {
    return `This action updates a #${id} commissionSetting`;
  }

  remove(id: number) {
    return `This action removes a #${id} commissionSetting`;
  }
}
