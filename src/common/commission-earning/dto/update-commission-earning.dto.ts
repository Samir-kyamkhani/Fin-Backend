import { PartialType } from '@nestjs/mapped-types';
import { CreateCommissionEarningDto } from './create-commission-earning.dto';

export class UpdateCommissionEarningDto extends PartialType(CreateCommissionEarningDto) {}
