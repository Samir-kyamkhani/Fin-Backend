import { PartialType } from '@nestjs/mapped-types';
import { CreateIpWhitelistDto } from './create-ip-whitelist.dto.js';

export class UpdateIpWhitelistDto extends PartialType(CreateIpWhitelistDto) {}
