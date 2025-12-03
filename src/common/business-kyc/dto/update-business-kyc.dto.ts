import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessKycDto } from './create-business-kyc.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateBusinessKycDto extends PartialType(CreateBusinessKycDto) {
  @IsUUID()
  @IsOptional()
  id?: string;
}
