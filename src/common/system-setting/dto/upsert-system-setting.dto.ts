import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';
import { SettingScope } from '../enums/system-setting.enum';

export class UpsertSystemSettingDto {
  @IsEnum(SettingScope)
  scope: SettingScope;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyLogo?: string;

  @IsOptional()
  @IsString()
  favIcon?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  companyEmail?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
