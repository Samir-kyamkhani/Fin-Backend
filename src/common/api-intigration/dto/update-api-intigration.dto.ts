import { PartialType } from '@nestjs/mapped-types';
import { CreateApiIntigrationDto } from './create-api-intigration.dto'

export class UpdateApiIntigrationDto extends PartialType(CreateApiIntigrationDto) {}
