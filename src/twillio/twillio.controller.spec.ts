import { Test, TestingModule } from '@nestjs/testing';
import { TwillioController } from './twillio.controller';
import { TwillioService } from './twillio.service';

describe('TwillioController', () => {
  let controller: TwillioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwillioController],
      providers: [TwillioService],
    }).compile();

    controller = module.get<TwillioController>(TwillioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
