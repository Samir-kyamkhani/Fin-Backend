import { PartialType } from '@nestjs/mapped-types';
import { CreateApiWebhookDto } from './create-api-webhook.dto.js';

export class UpdateApiWebhookDto extends PartialType(CreateApiWebhookDto) {}
