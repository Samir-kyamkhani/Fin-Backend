import { PartialType } from '@nestjs/mapped-types';
import { CreateIdempotencyKeyDto } from './create-idempotency-key.dto.js';

export class UpdateIdempotencyKeyDto extends PartialType(CreateIdempotencyKeyDto) {}
