// src/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { MailService } from './mailservice.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from 'src/invitation/invitation.entity';
import { Entreprise } from 'src/entreprise/entreprise.entity';
import { Utilisateur } from 'src/auth/auth.entity';
import { Conge } from 'src/conge/conge.entity';


@Module({
  imports:[
    MailerModule.forRoot({
      // Configuration SMTP ici
      transport: {
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      defaults: {
        from: `" Manage  bussiness" <${process.env.Email_User}>`,
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService], // Important: exporter le service
})
export class MailerviceModule {}