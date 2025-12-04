import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  Max,
  Length,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { BusinessType } from '../enums/business-kyc.enum.js';

export class CreateBusinessKycDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  businessName: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsString()
  @IsNotEmpty()
  @Length(5, 500)
  address: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{5,10}$/)
  pinCode: string;

  @IsUUID()
  stateId: string;

  @IsUUID()
  cityId: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  panNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(15, 20)
  gstNumber: string;

  @IsString()
  @IsOptional()
  udhyamAadhar?: string;

  @IsString()
  @IsOptional()
  brDoc?: string;

  @IsString()
  @IsOptional()
  partnershipDeed?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
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

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  authorizedMemberCount?: number;

  @IsString()
  @IsOptional()
  directorShareholding?: string;
}
