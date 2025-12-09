import { Test, TestingModule } from '@nestjs/testing';
import { CityService } from '../service/city.service';
import { PrismaService } from '../../../database/database.connection';

describe('CityService', () => {
  let service: CityService;

  // Create a real jest mock reference (safe for ESLint)
  const findManyMock = jest
    .fn()
    .mockResolvedValue([{ id: '1', cityName: 'Jaipur', cityCode: 'JPR' }]);

  const prismaMock = {
    city: {
      findMany: findManyMock,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CityService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CityService>(CityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all cities', async () => {
    const result = await service.findAll();

    expect(findManyMock).toHaveBeenCalled(); // No ESLint warning
    expect(result).toEqual([{ id: '1', cityName: 'Jaipur', cityCode: 'JPR' }]);
  });
});
