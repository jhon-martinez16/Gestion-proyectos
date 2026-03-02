import { Test, TestingModule } from '@nestjs/testing';
import { CompromisosController } from './compromisos.controller';

describe('CompromisosController', () => {
  let controller: CompromisosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompromisosController],
    }).compile();

    controller = module.get<CompromisosController>(CompromisosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
