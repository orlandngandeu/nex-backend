import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TacheService } from './tache.service';
import { TacheController } from './tache.controller';
import { tache } from './entities/tache.entity';

@Module({
  imports: [TypeOrmModule.forFeature([tache])],
  controllers: [TacheController],
  providers: [TacheService],
  exports: [TacheService],
})
export class TacheModule {}