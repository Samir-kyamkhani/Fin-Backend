import { PartialType } from '@nestjs/mapped-types';
import { CreateBankDetailDto } from './create-bank-detail.dto.js';

export class UpdateBankDetailDto extends PartialType(CreateBankDetailDto) {}
