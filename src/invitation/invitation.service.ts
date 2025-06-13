// src/invitation/invitation.service.ts
/*import { ConflictException, Injectable, UseGuards } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import * as crypto from 'crypto';
import { Utilisateur } from 'src/auth/auth.entity';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enums';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/role.guard';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(Utilisateur)
    private utilisateurRepository: Repository<Utilisateur>,
    private mailerService: MailerService,
  ) {}
  // generer et envoyer le code de confirmation a l'utilisateur
  @Roles(Role.Administrateur, Role.Gestionnaire)
  @UseGuards(AuthGuard(), RolesGuard)
  async genererEtEnvoyerInvitation(email: string, nom: string): Promise<void> {
    try {
      // Vérifier d'abord si l'utilisateur existe déjà
      const utilisateurExistant = await this.utilisateurRepository.findOne({
        where: { email },
      });

      if (utilisateurExistant) {
        if (utilisateurExistant /*.estActive) {
          throw new Error('Un utilisateur avec cet email existe déjà');
        }

        const codeInvitation = crypto
          .randomBytes(4)
          .toString('hex')
          .toUpperCase();

        // Enregistrer l'utilisateur avec le code
        const utilisateur = this.utilisateurRepository.create({
          email,
          nom,
          motDePasse: '',
          telephone: '',
          codeInvitation,
        });

        await this.utilisateurRepository.save(utilisateur);

        // Envoyer l'email
        await this.mailerService.sendMail({
          to: email,
          subject: 'Votre invitation',
          html: `
            <h2>Invitation</h2>
            <p>Bonjour a Vous ${nom},</p>
            <p>votre Code d'invitation est : <b>${codeInvitation}</b></p>
            <a href="${process.env.APP_URL}/inscription?}">Cliquez ici pour activer</a>
          `,
        });
      }
    } catch (error) {
      throw new ConflictException(error)
    }
  }
}*/

// src/invitation/invitation.service.ts
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation, InvitationStatus } from './invitation.entity';
import { Entreprise } from 'src/entreprise/entreprise.entity';
import { Utilisateur } from 'src/auth/auth.entity';
import { MailService } from 'src/mailservice/mailservice.service';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
import { Role } from 'src/enums/role.enums';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,

    @InjectRepository(Entreprise)
    private entrepriseRepository: Repository<Entreprise>,

    @InjectRepository(Utilisateur)
    private utilisateurRepository: Repository<Utilisateur>,

    private mailService: MailService,
  ) {}

  async createInvitation(
    email: string,
    entrepriseId: number,
    createdById: string,
  ): Promise<Invitation> {
    // 1. Vérification des types
    if (typeof entrepriseId !== 'number' || isNaN(entrepriseId)) {
      throw new BadRequestException('ID entreprise invalide');
    }
    if (typeof createdById !== 'string') {
      throw new BadRequestException('ID utilisateur invalide');
    }

    // const entreprise = await this.entrepriseRepository.findOne({
    //where: {idEtreprise: entrepriseId}
    // });
    // Recherche des entités
    const [entreprise, createdBy] = await Promise.all([
      this.entrepriseRepository.findOne({
        where: { idEtreprise: entrepriseId },
      }),
      this.utilisateurRepository.findOne({
        where: [
          { idUtilisateur: createdById, role: Role.Gestionnaire },
          { idUtilisateur: createdById, role: Role.Administrateur },
        ],
      }),
    ]);

    /*const createdBy = await this.utilisateurRepository.findOne({
      where: [
        { idUtilisateur: createdById, role: Role.Gestionnaire  },
        {idUtilisateur: createdById, role: Role.Administrateur }
      ] });*/

      if (!entreprise || !createdBy) {
        throw new NotFoundException('Entreprise ou utilisateur non trouvé');
      }

    const token = uuidv4();
    const expiresAt = addDays(new Date(), 7); // Expire dans 7 jours

    const invitation = this.invitationRepository.create({
      email,
      token,
      expiresAt,
      entreprise,
      createdBy,
    });

    const savedInvitation = await this.invitationRepository.save(invitation);

    // Envoyer l'email d'invitation
    await this.sendInvitationEmail(savedInvitation);

    return savedInvitation;
  }

  private async sendInvitationEmail(invitation: Invitation): Promise<void> {
    const acceptUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${invitation.token}`;
    console.log('=== EMAIL SIMULÉ ===');
    console.log(`Destinataire: ${invitation.email}`);
    console.log(`Lien d'invitation: http://votre-app.com/accept-invitation?token=${invitation.token}`);
    console.log('====================');
    const text = `
    Vous avez été invité à rejoindre ${invitation.entreprise.nom}.
    Pour accepter: ${acceptUrl}
    Lien valide jusqu'au ${invitation.expiresAt.toLocaleDateString()}.
  `;

    const html = `
    <p>Vous avez été invité à rejoindre ${invitation.entreprise.nom}.</p>
    <p><a href="${acceptUrl}">Accepter l'invitation</a></p>
    <p>Lien valide jusqu'au ${invitation.expiresAt.toLocaleDateString()}.</p>
  `;

    await this.mailService.sendMail({
      to: invitation.email,
      subject: `Invitation à rejoindre ${invitation.entreprise.nom}`,
      text: text, // Version texte
      html: html, // Version HTML
    });
  }

  async acceptInvitation(token: string, userId: string): Promise<Utilisateur> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['entreprise', 'utlisateur'],
    });

    if (!invitation) {
      throw new Error('Invitation non trouvée');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error('Invitation déjà traitée');
    }

    if (new Date() > invitation.expiresAt) {
      throw new Error('Invitation expirée');
    }

    const user = await this.utilisateurRepository.findOne({
      where: { idUtilisateur: userId },
    });
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier que l'email correspond
    if (user.email !== invitation.email) {
      throw new Error("L'email ne correspond pas à l'invitation");
    }

    // Mettre à jour l'utilisateur
    user.entreprise = invitation.entreprise;
    await this.utilisateurRepository.save(user);

    // Mettre à jour l'invitation
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.utilisateur = user;
    await this.invitationRepository.save(invitation);

    return user;
  }

  async getInvitationsByEntreprise(
    entrepriseId: number,
  ): Promise<Invitation[]> {
    return this.invitationRepository.find({
      where: { entreprise: { idEtreprise: entrepriseId } },
      relations: ['createdBy', 'utilisateur'],
    });
  }
}
