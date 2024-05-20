import { Module } from '@nestjs/common';
import { Mod1Service } from './mod1.service';

@Module({
  providers: [Mod1Service],
})
export class Mod1Module {}
