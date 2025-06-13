import {  BadRequestException, Body, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { SignUpDto } from './Dto/signUp.Dto';
import { LoginDto } from './Dto/login.dto';
import { Utilisateur } from 'src/auth/auth.entity';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class AuthService { 

    private transporter;

    constructor(
      @InjectRepository(Utilisateur)
      private readonly utilisateurRepository: Repository<Utilisateur>,
      private readonly notificationService: NotificationService,
      private readonly jwtService: JwtService,
    ){}

    // methode pour creer son profil
    async signUp(signUpDto: SignUpDto): Promise<{ token: string }> {
      const { nom, email, motDePasse, role , telephone } = signUpDto;
  
      try {
        // Vérifier si l'utilisateur avec cet email existe déjà
        const existingUtilisateur = await this.utilisateurRepository.findOne({ where: { email } });
        if (existingUtilisateur) {
          throw new ConflictException('Cet email est déjà utilisé.');
        }
  
        // Hasher le mot de passe
        const hashPassword = await bcrypt.hash(motDePasse, 10);
  
        // Créer un nouvel utilisateur
        const newUtilisateur = this.utilisateurRepository.create({
          nom,
          email, 
          motDePasse: hashPassword,
           role,
           telephone
          });
  
        // Enregistrer le nouvel utilisateur dans la base de données
        const savedUtilisateur = await this.utilisateurRepository.save(newUtilisateur);
  
        // Générer un JWT
        const token = this.jwtService.sign({ id: savedUtilisateur.idUtilisateur, roles: savedUtilisateur.role});
  
        return { token };
  
      } catch (error) {
        // Gérer les erreurs spécifiques
        if (error instanceof ConflictException) {
          throw error;
        }
        // Logguer l'erreur pour le débogage
        console.error('Erreur lors de l\'inscription:', error);
        // Lancer une erreur serveur générique pour ne pas exposer les détails internes
        throw new InternalServerErrorException('Une erreur est survenue lors de l\'inscription.');
      }
    }

    //methode pour se connecter 
    async login(loginDto: LoginDto): Promise<{ token: string; utilisateur: Partial<Utilisateur> }> {
      const { email, motDePasse } = loginDto;
    
      try {
        const utilisateur = await this.utilisateurRepository.findOne({ where: { email } });
    
        if (!utilisateur) {
          throw new UnauthorizedException('Identifiants invalides: utilisateur non existant.');
        }
    
        const motDePasseCorrespond = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    
        if (!motDePasseCorrespond) {
          throw new UnauthorizedException('Identifiants invalides: mot de passe incorrect.');
        }
    
        const token = this.jwtService.sign({ id: utilisateur.idUtilisateur });
    
        // Supprimer motDePasse en évitant le conflit de nom
        const { motDePasse: _, ...utilisateurSansMotDePasse } = utilisateur;
    
        return {
          token,
          utilisateur: utilisateurSansMotDePasse,
        };
    
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        console.error('Erreur lors de la connexion:', error);
        throw new InternalServerErrorException('Une erreur est survenue lors de la connexion.');
      }
    }
    

    //finaliser l'inscription apres l'invitation
    async finaliserInscription(code: string, motDepasse: string) {
      try {
        const utilisateur = await this.utilisateurRepository.findOneBy({ codeInvitation: code });
      
      if (!utilisateur) {
        throw new Error('Code d\'invitation invalide');
      }
  
      utilisateur.motDePasse = motDepasse;
      utilisateur.codeInvitation = code;

      if( utilisateur.codeInvitation!=code ){
        throw new Error('Code d\'invitation invalide');
      }
      await this.utilisateurRepository.save(utilisateur);
      return { message: 'Compte activé avec succès' };
    } catch (error) {
      throw new BadRequestException(error) 
    }
  }

  // Méthode pour demander la réinitialisation du mot de passe
  async demanderReinitialisationMotDePasse(email: string): Promise<{ message: string }> {
    try {
      // Rechercher l'utilisateur par email
      const utilisateur = await this.utilisateurRepository.findOne({ where: { email } });

      if (!utilisateur) {
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
        return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
      }

      // Générer un token de réinitialisation unique
      const tokenReinitialisation = crypto.randomBytes(32).toString('hex');
      const expirationToken = new Date();
      expirationToken.setHours(expirationToken.getHours() + 1); // Token valide 1 heure

      // Sauvegarder le token dans la base de données
      utilisateur.tokenReinitialisation = tokenReinitialisation;
      utilisateur.expirationTokenReinitialisation = expirationToken;
      await this.utilisateurRepository.save(utilisateur);

      // Envoyer l'email de réinitialisation
      await this.notificationService.envoyerEmailReinitialisation(email, tokenReinitialisation, utilisateur.nom);

      return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };

    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      throw new InternalServerErrorException('Une erreur est survenue lors de la demande de réinitialisation.');
    }
  }


  // Méthode pour réinitialiser le mot de passe avec le token
  async reinitialiserMotDePasse(token: string, nouveauMotDePasse: string): Promise<{ message: string }> {
    try {
      // Rechercher l'utilisateur avec le token valide
      const utilisateur = await this.utilisateurRepository.findOne({
        where: {
          tokenReinitialisation: token,
        },
      });

      if (!utilisateur) {
        throw new BadRequestException('Token de réinitialisation invalide.');
      }

      // Vérifier si le token n'a pas expiré
      if (utilisateur.expirationTokenReinitialisation < new Date()) {
        throw new BadRequestException('Le token de réinitialisation a expiré.');
      }

      // Hasher le nouveau mot de passe
      const nouveauMotDePasseHashe = await bcrypt.hash(nouveauMotDePasse, 10);

      // Mettre à jour le mot de passe et supprimer le token
      utilisateur.motDePasse = nouveauMotDePasseHashe;
      utilisateur.tokenReinitialisation = "";
      utilisateur.expirationTokenReinitialisation = new Date();

      await this.utilisateurRepository.save(utilisateur);

      return { message: 'Mot de passe réinitialisé avec succès.' };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw new InternalServerErrorException('Une erreur est survenue lors de la réinitialisation du mot de passe.');
    }
  }
 
}