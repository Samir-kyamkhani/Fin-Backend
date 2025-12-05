import { IsOptional, IsString, IsIP } from 'class-validator';

export class UpdateRootIpWhitelistDto {
  @IsOptional()
  @IsString()
  domainName?: string;

  @IsOptional()
  @IsString()
  @IsIP()
  serverIp: string;

  @IsOptional()
  @IsString()
  rootId: string;
}
