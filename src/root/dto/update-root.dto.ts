import { PartialType } from '@nestjs/mapped-types';
import { CreateRootDto } from './create-root.dto';

export class UpdateRootDto extends PartialType(CreateRootDto) {}
