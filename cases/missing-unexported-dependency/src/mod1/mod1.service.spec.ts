import { Test, TestingModule } from '@nestjs/testing';
import { Mod1Service } from './mod1.service';

describe('Mod1Service', () => {
  let service: Mod1Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Mod1Service],
    }).compile();

    service = module.get<Mod1Service>(Mod1Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
