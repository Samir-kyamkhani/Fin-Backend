import { IsString, IsDateString, IsEnum } from 'class-validator';
import { UserGender } from '../enums/user-kyc.enum';

export class CreateUserKycDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  fatherName: string;

  @IsDateString()
  dob: string;

  @IsEnum(UserGender)
  gender: UserGender;

  @IsString()
  address: string;

  @IsString()
  pinCode: string;

  @IsString()
  cityId: string;

  @IsString()
  stateId: string;

  @IsString()
  pan: string;

  @IsString()
  aadhaar: string;
}
