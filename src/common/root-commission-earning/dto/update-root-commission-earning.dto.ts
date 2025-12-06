import { PartialType } from '@nestjs/mapped-types';
import { CreateRootCommissionEarningDto } from './create-root-commission-earning.dto'

export class UpdateRootCommissionEarningDto extends PartialType(CreateRootCommissionEarningDto) {}
