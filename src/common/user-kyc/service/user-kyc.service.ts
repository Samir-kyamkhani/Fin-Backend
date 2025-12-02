import { Injectable } from '@nestjs/common';
import { CreateUserKycDto } from '../dto/create-user-kyc.dto';
import { UpdateUserKycDto } from '../dto/update-user-kyc.dto';

@Injectable()
export class UserKycService {
  create(createUserKycDto: CreateUserKycDto) {
    return 'This action adds a new userKyc';
  }

  findAll() {
    return `This action returns all userKyc`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userKyc`;
  }

  update(id: number, updateUserKycDto: UpdateUserKycDto) {
    return `This action updates a #${id} userKyc`;
  }

  remove(id: number) {
    return `This action removes a #${id} userKyc`;
  }
}
