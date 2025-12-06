import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { KycStatus } from '../enums/business-kyc.enum'

export class VerifyBusinessKycDto {
  @IsUUID()
  id: string;

  @IsEnum(KycStatus)
  status: KycStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
