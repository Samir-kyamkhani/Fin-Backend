import { IsString, IsOptional, IsIP, Length } from 'class-validator';

export class CreateIpWhitelistDto {
  @IsString()
  @Length(1, 255)
  domainName: string;

  // Accept IPv4/IPv6; if you want CIDR support remove IsIP and validate manually
  @IsString()
  @IsIP()
  serverIp: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  rootId?: string;
}
