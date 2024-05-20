import { Module } from '@nestjs/common';
import { Mod2Service } from './mod2.service';

@Module({
  providers: [Mod2Service],
  exports: [Mod2Service],
})
export class Mod2Module { }
