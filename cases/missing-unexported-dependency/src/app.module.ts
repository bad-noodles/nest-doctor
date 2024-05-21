import { Module } from '@nestjs/common';
import { Mod1Module } from './mod1/mod1.module';

@Module({
  imports: [Mod1Module],
})
export class AppModule { }
