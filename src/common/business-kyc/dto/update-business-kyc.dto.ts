import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BusinessType } from '../enums/business-kyc.enum';

export class UpdateBusinessKycDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  pinCode?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsUUID()
  stateId?: string;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsString()
  gst?: string;

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

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  authorizedMemberCount?: number;
}
