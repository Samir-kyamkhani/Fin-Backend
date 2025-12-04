import { PartialType } from '@nestjs/mapped-types';
import { CreateRootBankDetailDto } from './create-root-bank-detail.dto.js';

export class UpdateRootBankDetailDto extends PartialType(CreateRootBankDetailDto) {}
