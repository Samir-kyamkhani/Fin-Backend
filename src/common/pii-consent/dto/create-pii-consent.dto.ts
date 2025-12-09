import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePiiConsentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  piiType: string;

  @IsString()
  @IsNotEmpty()
  scope: string;

  @IsString()
  @IsNotEmpty()
  piiHash: string;

  @IsOptional()
  @IsString()
  businessKycId?: string;

  @IsOptional()
  @IsString()
  userKycId?: string;
}
