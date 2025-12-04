import { Injectable } from '@nestjs/common';
import { CreateBusinessKycDto } from '../dto/create-business-kyc.dto';
import { VerifyBusinessKycDto } from '../dto/verify-business-kyc.dto';
import { BusinessKycQueryDto } from '../dto/business-kyc-query.dto';
import { UpdateBusinessKycDto } from '../dto/update-business-kyc.dto';

@Injectable()
export class BusinessKycService {
  async getById(businessKycId: string, currentUser: any) {}

  async create(currentUser: any, createDto: CreateBusinessKycDto, files: any) {}

  async update(
    businessKycId: string,
    currentUser: any,
    updateDto: UpdateBusinessKycDto,
    files: any,
  ) {}

  async verify(currentUser: any, verifyDto: VerifyBusinessKycDto) {}

  async getAll(currentUser: any, query: BusinessKycQueryDto) {}
}
