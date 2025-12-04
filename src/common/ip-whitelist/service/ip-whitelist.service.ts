import { Injectable } from '@nestjs/common';
import { CreateIpWhitelistDto } from '../dto/create-ip-whitelist.dto.js';
import { UpdateIpWhitelistDto } from '../dto/update-ip-whitelist.dto.js';

@Injectable()
export class IpWhitelistService {
  create(createIpWhitelistDto: CreateIpWhitelistDto) {
    return 'This action adds a new ipWhitelist';
  }

  findAll() {
    return `This action returns all ipWhitelist`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ipWhitelist`;
  }

  update(id: number, updateIpWhitelistDto: UpdateIpWhitelistDto) {
    return `This action updates a #${id} ipWhitelist`;
  }

  remove(id: number) {
    return `This action removes a #${id} ipWhitelist`;
  }
}
