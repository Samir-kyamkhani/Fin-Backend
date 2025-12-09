import { Injectable } from '@nestjs/common';
import { BusinessKycService } from '../../common/business-kyc/service/business-kyc.service';
import { AuthActor } from '../../auth/interface/auth.interface';
import { CreateBusinessKycDto } from '../../common/business-kyc/dto/create-business-kyc.dto';
import { UpdateBusinessKycDto } from '../../common/business-kyc/dto/update-business-kyc.dto';

@Injectable()
export class AdminBusinessKYCService {
  constructor(private readonly businessKYCService: BusinessKycService) {}

  createByAdmin(
    bodyDataDto: CreateBusinessKycDto,
    currentUser: AuthActor,
    files: Express.Multer.File[],
  ) {
    return this.businessKYCService.create(bodyDataDto, currentUser, files);
  }

  updateByAdmin(
    id: string,
    bodyDataDto: UpdateBusinessKycDto,
    currentUser: AuthActor,
    files: Express.Multer.File[],
  ) {
    return this.businessKYCService.update(id, bodyDataDto, currentUser, files);
  }
}
