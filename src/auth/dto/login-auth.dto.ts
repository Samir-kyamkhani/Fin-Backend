import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MinLength(1)
  @MaxLength(255)
  email: string;

  @IsNumber()
  @IsOptional()
  customerId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  password: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @IsOptional()
  accuracy?: number;
}
