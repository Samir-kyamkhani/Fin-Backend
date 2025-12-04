import { Test, TestingModule } from '@nestjs/testing';
import { StateService } from '../service/state.service.js';

describe('StateService', () => {
  let service: StateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StateService],
    }).compile();

    service = module.get<StateService>(StateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
