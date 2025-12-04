import { Module } from '@nestjs/common';
import { ApiWebhookService } from './service/api-webhook.service.js';

@Module({
  imports: [],
  providers: [ApiWebhookService],
  exports: [ApiWebhookService],
})
export class ApiWebhookModule {}
