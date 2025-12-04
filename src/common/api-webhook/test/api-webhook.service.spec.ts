import { Test, TestingModule } from '@nestjs/testing';
import { ApiWebhookService } from '../service/api-webhook.service.js';

describe('ApiWebhookService', () => {
  let service: ApiWebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiWebhookService],
    }).compile();

    service = module.get<ApiWebhookService>(ApiWebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
