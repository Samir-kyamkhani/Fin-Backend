import { Injectable } from '@nestjs/common';

import { AuthActor } from '../../auth/interface/auth.interface';

import { GetAllUserKycDto } from '../../common/user-kyc/dto/get-all-user-kyc.dto';
import { VerifyUserKycDto } from '../../common/user-kyc/dto/verify-user-kyc.dto';

import { UserKycService } from '../../common/user-kyc/service/user-kyc.service';

@Injectable()
export class EmployeeUserKYCService {
  constructor(private readonly userKYCService: UserKycService) {}

  getAllKYCByEmployee(queryDto: GetAllUserKycDto, currentUser: AuthActor) {
    return this.userKYCService.getAllKyc(queryDto, currentUser);
  }

  getByIdEmployee(id: string) {
    return this.userKYCService.getByUserId(id);
  }

  deleteByEmployee(id: string, currentUser: AuthActor) {
    return this.userKYCService.delete(id, currentUser);
  }

  verifyByEmployee(id: string, dto: VerifyUserKycDto, currentUser: AuthActor) {
    return this.userKYCService.verify(id, dto, currentUser);
  }
}
