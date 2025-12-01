import { Test, TestingModule } from '@nestjs/testing';
import { SendCredentialsEmailService } from './send-credentials-email.service';

describe('SendCredentialsEmailService', () => {
  let service: SendCredentialsEmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SendCredentialsEmailService],
    }).compile();

    service = module.get<SendCredentialsEmailService>(SendCredentialsEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
