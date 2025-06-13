import { Injectable,  Logger,InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Conge, StatutConge } from './conge.entity';
import { Role } from 'src/enums/role.enums';
import { UpdateCongeDto } from './Dto/update-conge.dto';
import { Utilisateur } from 'src/auth/auth.entity';
import { CreateCongeDto } from './Dto/create-conge.dto';
import { error } from 'console';
import { MailService } from 'src/mailservice/mailservice.service';
import { Cron } from '@nestjs/schedule';


@Injectable()
export class CongeService {
  private readonly logger = new Logger(CongeService.name);
  constructor(
    @InjectRepository(Utilisateur)
    private utilisateurRepository: Repository<Utilisateur>,
    @InjectRepository(Conge)
    private congeRepository: Repository<Conge>,
    private readonly mailService: MailService,
  ) {}

 /* async createDemande( idUtilisateu: string, createCongeDto: CreateCongeDto): Promise<Conge> {
    try {
        const employe = await this.utilisateurRepository.findOne({
            where : {
              idUtilisateur : idUtilisateu
            }
        })

        if (!employe) {
          throw new NotFoundException('Employé non trouvé');
        }

        const dureeJours = this.calculerDuree(createCongeDto.dateDebut, createCongeDto.dateFin);

        const conge =  this.congeRepository.create({
          ...createCongeDto,
          employe,
          dureeJours,
          statut: StatutConge.EN_ATTENTE
        });

        if(!conge){
          console.log("la demande conge n'a pas ete creer")
          throw new NotFoundException(error)
        }
        console.log(conge)

        return this.congeRepository.save(conge);
    } catch (error) {
        throw new InternalServerErrorException(error)
    }
  }*/
//creation  d'une demande de conge
  async createDemande(idUtilisateu: string, createCongeDto: CreateCongeDto): Promise<Conge> {
    try {
      const employe = await this.utilisateurRepository.findOne({
        where: { idUtilisateur: idUtilisateu }
      });

      if (!employe) {
        throw new NotFoundException('Employé non trouvé');
      }

      // Vérification si la date de début est déjà passée
      const maintenant = new Date();
      const statut = createCongeDto.dateDebut < maintenant ? StatutConge.EXPIRE : StatutConge.EN_ATTENTE;

      const dureeJours = this.calculerDuree(createCongeDto.dateDebut, createCongeDto.dateFin);

      const conge = this.congeRepository.create({
        ...createCongeDto,
        employe,
        dureeJours,
        statut: statut // Statut dépend de la date
      });

      if (!conge) {
        throw new NotFoundException("La demande de congé n'a pas pu être créée");
      }

      const savedConge = await this.congeRepository.save(conge);
      
      // Envoyer notification seulement si le statut n'est pas EXPIRÉ
      if (savedConge.statut !== StatutConge.EXPIRE) {
        await this.envoyerNotificationCreation(savedConge);//fonctionctiond'envoie utiliser
      }

      return savedConge;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Nouvelle méthode pour notifier la création
  private async envoyerNotificationCreation(conge: Conge): Promise<void> {//fonction d'envoie creer ici 
    try {
      const sujet = `Nouvelle demande de congé en attente`;
      const text = `Bonjour,\n\nUne nouvelle demande de congé a été soumise par ${conge.employe.nom}.\n\n`;
      const html = `<p>Bonjour,</p><p>Une nouvelle demande de congé a été soumise par <strong>${conge.employe.nom}</strong>.</p>`;

      // Envoyer aux gestionnaires
      const gestionnaires = await this.utilisateurRepository.find({
        where: { role: In([Role.Gestionnaire, Role.Administrateur]) }
      });

      for (const gestionnaire of gestionnaires) {
        await this.mailService.sendMail({
          to: gestionnaire.email,
          subject: sujet,
          text: text,
          html: html
        });
      }

      this.logger.log(`Notifications envoyées aux gestionnaires pour le congé ${conge.id}`);
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi des notifications de création', error.stack);
    }
  }


async traiterDemande(congeId: number, gestionnaireId: string, updateCongeDto: UpdateCongeDto): Promise<Conge> {
    try {
        // Vérification du rôle gestionnaire
    /*const gestionnaire = await this.utilisateurRepository.findOne({ 
        where: { idUtilisateur: gestionnaireId, role: Role.Gestionnaire || Role.Administrateur } 
      })*/

      const gestionnaire = await this.utilisateurRepository.findOne({
      where: {
        idUtilisateur: gestionnaireId,
        role: In([Role.Gestionnaire, Role.Administrateur]),
      },
});
  
      if (!gestionnaire) {
          throw new NotFoundException('Gestionnaire non trouvé');
        }
  
      const conge = await this.congeRepository.findOne({
        where: { id: congeId },
        relations: ['employe', 'gestionnaire']
      });
  
      if (!conge) {
        throw new NotFoundException('Demande de congé non trouvée');
      }
  
      // Sauvegarde de l'ancien statut pour vérifier s'il change
      const ancienStatut = conge.statut;
      if (updateCongeDto.statut) {
        conge.statut = updateCongeDto.statut;
        conge.gestionnaire = gestionnaire;
      }
  
      if (updateCongeDto.motifRefus) {
        conge.motifRefus = updateCongeDto.motifRefus;
      }
      const congeMisAJour = await this.congeRepository.save(conge);
       await this.envoyerNotificationConge(congeMisAJour)
  
      return congeMisAJour;  
    } catch (error) {
        throw new InternalServerErrorException(error)
    }
  }

  private async envoyerNotificationConge(conge: Conge): Promise<void> {
    try {
      const sujet = `Mise à jour de votre demande de congé`;
      
      // Version texte
      let text = `Bonjour  M./Mme ${conge.employe.nom},\n\n`;
      
      // Version HTML
      let html = `<p>Bonjour ${conge.employe.nom},</p><p>`;
      
      if (conge.statut === 'ACCEPTE') {
        text += `Votre demande de congé du ${conge.dateDebut} au ${conge.dateFin} a été approuvée.`;
        html += `Votre demande de congé du <strong>${conge.dateDebut}</strong> au <strong>${conge.dateFin}</strong> a été <span style="color: green;">approuvée</span>.`;
      } else if (conge.statut === 'REFUSE') {
        text += `Votre demande de congé du ${conge.dateDebut} au ${conge.dateFin} a été refusée.`;
        html += `Votre demande de congé du <strong>${conge.dateDebut}</strong> au <strong>${conge.dateFin}</strong> a été <span style="color: red;">refusée</span>.`;
        
        if (conge.motifRefus) {
          text += `\nMotif : ${conge.motifRefus}`;
          html += `<br/><br/>Motif : <em>${conge.motifRefus}</em>`;
        }
      }
      
      text += `\n\nCordialement,\nL'équipe des RH`;
      html += `</p><p>Cordialement,<br/>L'équipe des RH</p>`;

      await this.mailService.sendMail({
        to: conge.employe.email,
        subject: sujet,
        text: text,
        html: html,
      });

      this.logger.log(`Notification envoyée à ${conge.employe.email}`);
    } catch (error) {
      this.logger.error(
        `Échec d'envoi de notification pour le congé ${conge.id}`,
        error.stack,
      );
    }
  }

  private calculerDuree(dateDebut: Date, dateFin: Date): number {
    const diffTime = Math.abs(dateFin.getTime() - dateDebut.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async getDemandesEmploye(employeId: string): Promise<Conge[] | null> {
    return this.congeRepository.find({
      
      relations: ['gestionnaire'],
      order: { createdAt: 'DESC' }
    });
  }

  async getDemandesEnAttente(): Promise<Conge[]> {
    return this.congeRepository.find({
      where: { statut: StatutConge.EN_ATTENTE },
      relations: ['employe'],
      order: { createdAt: 'ASC' }
    });
  }

@Cron('0 0 * * *') // Exécution quotidienne à minuit
async verifierCongesExpires() {
  try {
    const maintenant = new Date();
    const result =  await this.congeRepository
      .createQueryBuilder()
      .update(Conge)
      .set({ statut: StatutConge.EXPIRE })
      .where('statut = :EN_ATTENTE', { statutAttente: StatutConge.EN_ATTENTE })
      .andWhere('dateDebut < :maintenant', { maintenant })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`${result.affected} congés marqués comme expirés`);
    }
  } catch (error) {
    this.logger.error('Erreur lors de la vérification des congés expirés', error.stack);
  }
}

  
}
