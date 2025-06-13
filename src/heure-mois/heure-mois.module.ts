import { Module } from '@nestjs/common';
import { HeureMoisService } from './heure-mois.service';
import { HeureMoisController } from './heure-mois.controller';

@Module({
  controllers: [HeureMoisController],
  providers: [HeureMoisService],
})
export class HeureMoisModule {}
