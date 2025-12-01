import { Injectable } from '@nestjs/common';
import { CreateBusinessKycDto } from './dto/create-business-kyc.dto';
import { UpdateBusinessKycDto } from './dto/update-business-kyc.dto';

@Injectable()
export class BusinessKycService {
  create(createBusinessKycDto: CreateBusinessKycDto) {
    return 'This action adds a new businessKyc';
  }

  findAll() {
    return `This action returns all businessKyc`;
  }

  findOne(id: number) {
    return `This action returns a #${id} businessKyc`;
  }

  update(id: number, updateBusinessKycDto: UpdateBusinessKycDto) {
    return `This action updates a #${id} businessKyc`;
  }

  remove(id: number) {
    return `This action removes a #${id} businessKyc`;
  }
}
