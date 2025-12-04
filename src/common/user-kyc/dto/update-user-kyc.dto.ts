import { PartialType } from '@nestjs/mapped-types';
import { CreateUserKycDto } from './create-user-kyc.dto.js';

export class UpdateUserKycDto extends PartialType(CreateUserKycDto) {}
