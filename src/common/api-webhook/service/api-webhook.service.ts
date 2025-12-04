import { Injectable } from '@nestjs/common';
import { CreateApiWebhookDto } from '../dto/create-api-webhook.dto.js';
import { UpdateApiWebhookDto } from '../dto/update-api-webhook.dto.js';

@Injectable()
export class ApiWebhookService {
  create(createApiWebhookDto: CreateApiWebhookDto) {
    return 'This action adds a new apiWebhook';
  }

  findAll() {
    return `This action returns all apiWebhook`;
  }

  findOne(id: number) {
    return `This action returns a #${id} apiWebhook`;
  }

  update(id: number, updateApiWebhookDto: UpdateApiWebhookDto) {
    return `This action updates a #${id} apiWebhook`;
  }

  remove(id: number) {
    return `This action removes a #${id} apiWebhook`;
  }
}
