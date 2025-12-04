import { PartialType } from '@nestjs/mapped-types';
import { CreateRootCommissionEarningDto } from './create-root-commission-earning.dto.js';

export class UpdateRootCommissionEarningDto extends PartialType(CreateRootCommissionEarningDto) {}
