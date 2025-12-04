import { PartialType } from '@nestjs/mapped-types';
import { CreateRootDto } from './create-root.dto.js';

export class UpdateRootDto extends PartialType(CreateRootDto) {}
