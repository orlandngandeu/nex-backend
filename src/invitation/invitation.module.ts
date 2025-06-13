import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { Invitation } from './invitation.entity';
import { Entreprise } from 'src/entreprise/entreprise.entity';
import { Utilisateur } from 'src/auth/auth.entity';
import { EntrepriseService } from 'src/entreprise/entreprise.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailerviceModule } from 'src/mailservice/mailservice.module';
import { Conge } from 'src/conge/conge.entity';

/*@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, Entreprise, Utilisateur]), // Toutes les entités nécessaires
    MailModule // Import du module Mail
  ],
  controllers: [InvitationController],
  providers: [ InvitationService,],
  exports: [InvitationService], // Important si utilisé ailleurs
})
export class InvitationModule {}*/

// src/invitation/invitation.module.ts
/*import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { Invitation } from './invitation.entity';
import { Entreprise } from 'src/entreprise/entreprise.entity';
import { Utilisateur } from 'src/auth/auth.entity';
import { MailModule } from 'src/mailservice/mailservice.module';*/


@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, Entreprise, Utilisateur]),
    MailerModule, 
    MailerviceModule// Import du module Mail
  ],
  controllers: [InvitationController],
  providers: [
    InvitationService,
    EntrepriseService,
     // Déclarez le repository comme provider
  ],
  exports: [InvitationService,TypeOrmModule.forFeature([Invitation, Entreprise, Utilisateur, Conge]),], // Important si utilisé ailleurs
})
export class InvitationModule {}