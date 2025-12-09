import { IsEnum, IsString, ValidateIf } from 'class-validator';
import { KycStatus } from '../enums/business-kyc.enum';

export class VerifyBusinessKycDto {
  @IsEnum(KycStatus)
  status: KycStatus;

  @ValidateIf((o: VerifyBusinessKycDto) => o.status === KycStatus.REJECTED)
  @IsString()
  rejectionReason?: string;
}
