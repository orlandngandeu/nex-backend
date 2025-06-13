import { Module } from '@nestjs/common';
import { ContractModule } from './contrat/contrat.module';
import { TacheModule } from './tache/tache.module';
import { CommentaireModule } from './commentaire/commentaire.module';
import { NotificationModule } from './notification/notification.module';
import {ConfigModule,ConfigService} from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { GoogleAuthModule } from './google-auth/google-auth.module';
import { EmployesModule } from './employes/employes.module';
import { CongeModule } from './conge/conge.module';
import { EntrepriseModule } from './entreprise/entreprise.module';
import { InvitationModule } from './invitation/invitation.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HeureMoisModule } from './heure-mois/heure-mois.module';
import { RapportModule } from './rapport/rapport.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModules } from './auths/auth.module';




@Module({
  imports: [ // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: +configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'loic'),
        database: configService.get<string>('DATABASE_NAME', 'bd'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'], 
        autoLoadEntities: true,
        synchronize: true, //  À désactiver en production
        parseInputFloatsEnabled: true
      }
    ),
      
      inject: [ConfigService],
    }),
    ContractModule,TacheModule, CommentaireModule,NotificationModule,AuthModule,GoogleAuthModule,EmployesModule,CongeModule,EntrepriseModule,InvitationModule,MailerModule, HeureMoisModule, RapportModule,AuthModules
],
  controllers: [],
  providers: [],
})
export class AppModule {}
