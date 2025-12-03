import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { KycStatus } from '../enums/business-kyc.enum';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class BusinessKycQueryDto {
  @IsOptional()
  @IsEnum(KycStatus)
  status?: KycStatus | 'ALL' = 'ALL';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @IsOptional()
  @IsEnum(SortOrder)
  sort?: SortOrder = SortOrder.DESC;
}
