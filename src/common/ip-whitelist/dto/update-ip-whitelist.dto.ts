import { IsString, IsOptional, IsIP, Length } from 'class-validator';
export class UpdateIpWhitelistDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  domainName?: string;

  @IsOptional()
  @IsString()
  @IsIP()
  serverIp?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  rootId?: string | null;
}
