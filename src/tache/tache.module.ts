import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TacheController } from './tache.controller';
import { TacheService } from './tache.service';
import { tache } from './entities/tache.entity';
import { NotificationService } from '../notification/notification.service';
import { Utilisateur } from '../auth/auth.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TypeOrmModule.forFeature([tache, Utilisateur]), ScheduleModule.forRoot()],
  controllers: [TacheController],
  providers: [TacheService, NotificationService],
  exports: [TacheService],
})
export class TacheModule {}