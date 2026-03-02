import { Test, TestingModule } from '@nestjs/testing';
import { CompromisosService } from './compromisos.service';

describe('CompromisosService', () => {
  let service: CompromisosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompromisosService],
    }).compile();

    service = module.get<CompromisosService>(CompromisosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
