import { PartialType } from '@nestjs/mapped-types';
import { CreateApiWebhookDto } from './create-api-webhook.dto';

export class UpdateApiWebhookDto extends PartialType(CreateApiWebhookDto) {}
