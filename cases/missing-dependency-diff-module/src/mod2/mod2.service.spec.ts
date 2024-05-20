import { Test, TestingModule } from '@nestjs/testing';
import { Mod2Service } from './mod2.service';

describe('Mod2Service', () => {
  let service: Mod2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Mod2Service],
    }).compile();

    service = module.get<Mod2Service>(Mod2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
