import { PartialType } from '@nestjs/mapped-types';
import { CreateApiEntityDto } from './create-api-entity.dto.js';

export class UpdateApiEntityDto extends PartialType(CreateApiEntityDto) {}
