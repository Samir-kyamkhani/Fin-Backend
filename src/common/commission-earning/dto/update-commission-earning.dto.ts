import { PartialType } from '@nestjs/mapped-types';
import { CreateCommissionEarningDto } from './create-commission-earning.dto.js';

export class UpdateCommissionEarningDto extends PartialType(CreateCommissionEarningDto) {}
