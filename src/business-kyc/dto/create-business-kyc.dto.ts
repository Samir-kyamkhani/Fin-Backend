import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBusinessKycDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsEnum(['PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED'])
  businessType: 'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PRIVATE_LIMITED';

  @IsEnum(['PENDING', 'VERIFIED', 'REJECTED', 'PROCESSING', 'HOLD'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @IsString()
  @IsNotEmpty()
  panNumber: string;

  @IsString()
  @IsNotEmpty()
  gstNumber: string;

  @IsString()
  @IsNotEmpty()
  panFile: string;

  @IsString()
  @IsNotEmpty()
  gstFile: string;

  @IsString()
  @IsOptional()
  udhyamAadhar?: string;

  @IsString()
  @IsOptional()
  brDoc?: string;

  @IsString()
  @IsOptional()
  partnershipDeed?: string;

  @ValidateIf(o => o.businessType === 'PARTNERSHIP')
  @Min(2, { message: 'Partnership requires minimum 2 authorized members' })
  @Max(20)
  @IsOptional()
  authorizedMemberCount?: number;

  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  partnerKycNumbers?: number;

  @IsString()
  @IsOptional()
  cin?: string;

  @IsString()
  @IsOptional()
  moaFile?: string;

  @IsString()
  @IsOptional()
  aoaFile?: string;

  @IsString()
  @IsOptional()
  directorShareholding?: string;

  @IsUUID()
  @IsOptional()
  verifiedById?: string;

  @IsEnum(['Root', 'Employee'])
  @IsOptional()
  verifiedByType?: 'Root' | 'Employee';

  @IsDateString()
  @IsOptional()
  verifiedAt?: Date;
}
