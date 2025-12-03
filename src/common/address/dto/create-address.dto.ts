import { IsUUID, IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  @Length(5, 500, { message: 'Address must be between 5 and 500 characters' })
  address: string;

  @IsString()
  @IsNotEmpty({ message: 'PIN code is required' })
  @Matches(/^[0-9]{5,10}$/, {
    message: 'PIN code must be 5-10 digits',
  })
  pinCode: string;

  @IsUUID('4', { message: 'Invalid state ID format' })
  @IsNotEmpty({ message: 'State ID is required' })
  stateId: string;

  @IsUUID('4', { message: 'Invalid city ID format' })
  @IsNotEmpty({ message: 'City ID is required' })
  cityId: string;
}
