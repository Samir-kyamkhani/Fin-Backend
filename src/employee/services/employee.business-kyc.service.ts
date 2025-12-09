import { Injectable } from '@nestjs/common';
import { BusinessKycService } from '../../common/business-kyc/service/business-kyc.service';
import { BusinessKycQueryDto } from '../../common/business-kyc/dto/business-kyc-query.dto';
import { AuthActor } from '../../auth/interface/auth.interface';
import { VerifyBusinessKycDto } from '../../common/business-kyc/dto/verify-business-kyc.dto';

@Injectable()
export class EmployeeBusinessKYCService {
  constructor(private readonly businessKYCService: BusinessKycService) {}

  getAllKYCByEmployee(query: BusinessKycQueryDto, currentUser: AuthActor) {
    return this.businessKYCService.getAll(query, currentUser);
  }

  getByIdEmployee(id: string) {
    return this.businessKYCService.getByUserId(id);
  }

  deleteByEmployee(id: string, currentUser: AuthActor) {
    return this.businessKYCService.delete(id, currentUser);
  }

  verifyByEmployee(
    id: string,
    dto: VerifyBusinessKycDto,
    currentUser: AuthActor,
  ) {
    return this.businessKYCService.verify(id, dto, currentUser);
  }
}
