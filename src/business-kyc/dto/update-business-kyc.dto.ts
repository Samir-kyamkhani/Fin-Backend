import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessKycDto } from './create-business-kyc.dto';

export class UpdateBusinessKycDto extends PartialType(CreateBusinessKycDto) {}
