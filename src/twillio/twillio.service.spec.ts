import { Test, TestingModule } from '@nestjs/testing';
import { TwillioService } from './twillio.service';

describe('TwillioService', () => {
  let service: TwillioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwillioService],
    }).compile();

    service = module.get<TwillioService>(TwillioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
