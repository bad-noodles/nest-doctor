import { Injectable } from '@nestjs/common';
import { Mod2Service } from 'src/mod2/mod2.service';

@Injectable()
export class Mod1Service {
  constructor(private m2: Mod2Service) { }
}
