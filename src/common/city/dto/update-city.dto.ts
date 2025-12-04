import { PartialType } from '@nestjs/mapped-types';
import { CreateCityDto } from './create-city.dto.js';

export class UpdateCityDto extends PartialType(CreateCityDto) {}
