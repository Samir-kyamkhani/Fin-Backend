// dto/create-commission-setting.dto.ts
import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import {
  CommissionScope,
  CommissionType,
} from '../enums/commission-setting.enum';

export class CreateCommissionSettingDto {
  @IsEnum(CommissionScope)
  scope: CommissionScope;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsUUID()
  @IsOptional()
  targetUserId?: string;

  @IsUUID()
  @IsOptional()
  serviceId?: string;

  // COMMISSION
  @IsEnum(CommissionType)
  @IsOptional()
  commissionType?: CommissionType;

  @IsNumber()
  @IsOptional()
  commissionValue?: number;

  // SURCHARGE
  @IsEnum(CommissionType)
  @IsOptional()
  surchargeType?: CommissionType;

  @IsNumber()
  @IsOptional()
  surchargeValue?: number;

  // SLABS (number → DB bigint)
  @IsInt()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @IsBoolean()
  @IsOptional()
  applyTDS?: boolean;

  @IsNumber()
  @IsOptional()
  tdsPercent?: number;

  @IsBoolean()
  @IsOptional()
  applyGST?: boolean;

  @IsNumber()
  @IsOptional()
  gstPercent?: number;
}
