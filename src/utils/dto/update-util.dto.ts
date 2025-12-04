import { PartialType } from '@nestjs/mapped-types';
import { CreateUtilDto } from './create-util.dto.js';

export class UpdateUtilDto extends PartialType(CreateUtilDto) {}
