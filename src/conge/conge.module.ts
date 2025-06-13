import { Module } from '@nestjs/common';
import { CongeService } from './conge.service';
import { AuthModule } from 'src/auth/auth.module';
import { Conge } from './conge.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CongeController } from './conge.controller';
import { EmployesModule } from 'src/employes/employes.module';
import { Utilisateur } from 'src/auth/auth.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from 'src/mailservice/mailservice.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Conge]),
    TypeOrmModule.forFeature([Utilisateur]),
    MailerModule,
  ],
  controllers:[CongeController],
  exports:[
    CongeModule,
    TypeOrmModule.forFeature([Conge]),
  ],
  providers: [CongeService, MailService]
})
export class CongeModule {}
