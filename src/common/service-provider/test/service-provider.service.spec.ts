import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProviderService } from '../service/service-provider.service.js';

describe('ServiceProviderService', () => {
  let service: ServiceProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceProviderService],
    }).compile();

    service = module.get<ServiceProviderService>(ServiceProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
