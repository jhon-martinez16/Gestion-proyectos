import { Test, TestingModule } from '@nestjs/testing';
import { EntregablesService } from './entregables.service';

describe('EntregablesService', () => {
  let service: EntregablesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EntregablesService],
    }).compile();

    service = module.get<EntregablesService>(EntregablesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
