import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceProviderDto } from './create-service-provider.dto.js';

export class UpdateServiceProviderDto extends PartialType(CreateServiceProviderDto) {}
