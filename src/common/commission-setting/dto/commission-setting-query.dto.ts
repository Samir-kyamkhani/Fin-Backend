import { IsOptional, IsBoolean, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionScope } from '../enums/commission-setting.enum';

export class CommissionSettingQueryDto {
  @IsOptional()
  @IsString()
  scope?: CommissionScope;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
