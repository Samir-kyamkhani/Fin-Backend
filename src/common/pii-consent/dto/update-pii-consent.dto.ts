import { PartialType } from '@nestjs/mapped-types';
import { CreatePiiConsentDto } from './create-pii-consent.dto'

export class UpdatePiiConsentDto extends PartialType(CreatePiiConsentDto) {}
