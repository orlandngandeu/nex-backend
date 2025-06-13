import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ContractController } from './contrat.controller';
import { ContractService } from './contrat.service';
import { NotificationService } from '../notification/notification.service';
import { Contract } from './entities/contrat.entity';
import { tache } from '../tache/entities/tache.entity';
import { commentaire } from '../commentaire/entities/commentaire.entity';
import { Presence } from '../presence/entities/presence.entity';
import { NotificationModule } from '../notification/notification.module';
import { Utilisateur } from 'src/auth/auth.entity';
import { heuremois } from '../heure-mois/entities/heure-mois.entity';
import { ScheduledNotificationService} from './Scheduled.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract,
      Utilisateur,
      heuremois,
      tache,
      commentaire,
      Presence,
      
    ]),
    NotificationModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [ContractController],
  providers: [ContractService, NotificationService, ScheduledNotificationService],
  exports: [ContractService,ScheduledNotificationService],
})
export class ContractModule {}