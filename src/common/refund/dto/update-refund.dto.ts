import { PartialType } from '@nestjs/mapped-types';
import { CreateRefundDto } from './create-refund.dto.js';

export class UpdateRefundDto extends PartialType(CreateRefundDto) {}
