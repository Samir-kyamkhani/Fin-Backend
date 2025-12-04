import { PartialType } from '@nestjs/mapped-types';
import { CreateApiIntigrationDto } from './create-api-intigration.dto.js';

export class UpdateApiIntigrationDto extends PartialType(CreateApiIntigrationDto) {}
