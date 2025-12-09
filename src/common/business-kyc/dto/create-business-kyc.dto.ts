import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BusinessType } from '../enums/business-kyc.enum';

export class CreateBusinessKycDto {
  @IsString()
  businessName: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsString()
  address: string;

  @IsString()
  pinCode: string;

  @IsUUID()
  cityId: string;

  @IsUUID()
  stateId: string;

  @IsString()
  pan: string;

  @IsString()
  gst: string;

  @IsOptional()
  @IsString()
  udhyamAadhar?: string;

  @IsOptional()
  @IsString()
  cin?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  partnerKycNumbers?: number;

  @IsNumber()
  @Type(() => Number)
  authorizedMemberCount: number;
}
