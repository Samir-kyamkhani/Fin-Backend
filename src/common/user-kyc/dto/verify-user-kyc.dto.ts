import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserKycStatus } from '../enums/user-kyc.enum';

export class VerifyUserKycDto {
  @IsEnum(UserKycStatus)
  status: UserKycStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
