import { IsUUID } from 'class-validator';

export class DeleteAddressDto {
  @IsUUID('4', { message: 'Invalid address ID format' })
  id: string;
}
