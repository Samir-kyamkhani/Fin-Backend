import { IsOptional, IsString, IsIP } from 'class-validator';

export class UpdateUserIpWhitelistDto {
  @IsOptional()
  @IsString()
  domainName?: string;

  @IsOptional()
  @IsString()
  @IsIP()
  serverIp: string;

  @IsOptional()
  @IsString()
  userId: string;
}
