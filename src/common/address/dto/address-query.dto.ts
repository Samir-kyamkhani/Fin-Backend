import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddressQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'Invalid state ID format' })
  stateId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid city ID format' })
  cityId?: string;

  @IsOptional()
  @IsString()
  pinCode?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}
