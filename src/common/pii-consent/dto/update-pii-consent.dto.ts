import { PartialType } from '@nestjs/mapped-types';
import { CreatePiiConsentDto } from './create-pii-consent.dto.js';

export class UpdatePiiConsentDto extends PartialType(CreatePiiConsentDto) {}
