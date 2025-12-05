import { IsString, IsIP, Length } from 'class-validator';

export class CreateRootIpWhitelistDto {
  @IsString()
  @Length(1, 255)
  domainName: string;

  @IsString()
  @IsIP()
  serverIp: string;

  @IsString()
  rootId: string; // REQUIRED
}
