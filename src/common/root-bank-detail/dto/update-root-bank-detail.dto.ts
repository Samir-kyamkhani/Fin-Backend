import { PartialType } from '@nestjs/mapped-types';
import { CreateRootBankDetailDto } from './create-root-bank-detail.dto';

export class UpdateRootBankDetailDto extends PartialType(CreateRootBankDetailDto) {}
