import { IsString, IsIP, Length } from 'class-validator';

export class CreateUserIpWhitelistDto {
  @IsString()
  @Length(1, 255)
  domainName: string;

  @IsString()
  @IsIP()
  serverIp: string;

  @IsString()
  userId: string; // REQUIRED
}
