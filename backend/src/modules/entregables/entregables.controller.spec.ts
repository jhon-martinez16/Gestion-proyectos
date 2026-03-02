import { Test, TestingModule } from '@nestjs/testing';
import { EntregablesController } from './entregables.controller';

describe('EntregablesController', () => {
  let controller: EntregablesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntregablesController],
    }).compile();

    controller = module.get<EntregablesController>(EntregablesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
