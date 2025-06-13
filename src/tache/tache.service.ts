import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { tache } from './entities/tache.entity';
import { CreateTacheDto } from './dto/create-tache.dto';
import { UpdateTacheDto } from './dto/update-tache.dto';
import { UpdateTacheStatutDto } from './dto/update-tache-statut.dto';
import { NotificationService } from '../notification/notification.service';
import { Utilisateur } from '../auth/auth.entity';
import { StatutTache } from '../enums/StatutTache';

@Injectable()
export class TacheService {
  constructor(
    @InjectRepository(tache)
    private tacheRepository: Repository<tache>,
    private notificationService: NotificationService,
    @InjectRepository(Utilisateur)
    private utilisateurRepository: Repository<Utilisateur>,
  ) {}

  async create(createTacheDto: CreateTacheDto): Promise<tache> {
    try {
      const nouvelleTache = this.tacheRepository.create({
        titre: createTacheDto.titre,
        description: createTacheDto.description,
        employeAssigne: { idUtilisateur: createTacheDto.employeAssigneId },
        dateEcheance: createTacheDto.dateEcheance,
        priorite: createTacheDto.priorite,
        type: StatutTache.EN_ATTENTE,
        dureeEnHeures: createTacheDto.dureeEnHeures,
      });

      if (!createTacheDto.dureeEnHeures && createTacheDto.dateEcheance) {
        const maintenant = new Date();
        const diffMs = new Date(createTacheDto.dateEcheance).getTime() - maintenant.getTime();
        nouvelleTache.dureeEnHeures = Math.max(0.1, diffMs / (1000 * 60 * 60));
      }

      const tacheSauvegardee = await this.tacheRepository.save(nouvelleTache);

      await this.notifierEmploye(
        createTacheDto.employeAssigneId,
        `Nouvelle tâche assignée: ${createTacheDto.titre}`,
        'tache_assignee'
      );

      return tacheSauvegardee;
    } catch (error) {
      throw new BadRequestException(`Erreur lors de la création de la tâche: ${error.message}`);
    }
  }

  async findAll(filters?: { titre?: string; statut?: StatutTache; priorite?: string }): Promise<tache[]> {
    try {
      const where = {};

      if (filters) {
        if (filters.titre) {
          where['titre'] = Like(`%${filters.titre}%`);
        }
        if (filters.statut) {
          where['StatutTache'] = filters.statut;
        }
        if (filters.priorite) {
          where['priorite'] = filters.priorite;
        }
      }

      return await this.tacheRepository.find({
        where,
        relations: ['employeAssigne'],
      });
    } catch (error) {
      throw new BadRequestException(`Erreur lors de la récupération des tâches: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<tache> {
    try {
      const tache = await this.tacheRepository.findOne({
        where: { idTache: id },
        relations: ['employeAssigne'],
      });

      if (!tache) {
        throw new NotFoundException(`Tâche avec ID ${id} non trouvée`);
      }

      return tache;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la récupération de la tâche: ${error.message}`);
    }
  }

  async update(id: string, updateTacheDto: UpdateTacheDto): Promise<tache> {
    try {
      const tache = await this.findOne(id);

      const ancienEmployeId = tache.employeAssigne?.idUtilisateur;
      const nouveauEmployeId = updateTacheDto.employeAssigneId;

      const updateData = { ...updateTacheDto };

      if (updateTacheDto.employeAssigneId) {
        delete updateData.employeAssigneId;
        tache.employeAssigne = { idUtilisateur: updateTacheDto.employeAssigneId } as any;
      }

      Object.assign(tache, updateData);

      if (updateTacheDto.dateEcheance && !updateTacheDto.dureeEnHeures) {
        const diffMs = new Date(updateTacheDto.dateEcheance).getTime() - tache.dateCreation.getTime();
        tache.dureeEnHeures = Math.max(0.1, diffMs / (1000 * 60 * 60));
      }

      const tacheMiseAJour = await this.tacheRepository.save(tache);

      if (nouveauEmployeId && ancienEmployeId !== nouveauEmployeId) {
        await this.notifierEmploye(
          nouveauEmployeId,
          `Vous avez été assigné à la tâche: ${tache.titre}`,
          'tache_assignee'
        );
      }

      return tacheMiseAJour;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la mise à jour de la tâche: ${error.message}`);
    }
  }

  async updateStatut(id: string, updateTacheStatutDto: UpdateTacheStatutDto): Promise<tache> {
    try {
      const tache = await this.findOne(id);

      tache.type = updateTacheStatutDto.type;

      const tacheMiseAJour = await this.tacheRepository.save(tache);

      await this.notifierEmploye(
        tache.employeAssigne.idUtilisateur,
        `Le statut de la tâche "${tache.titre}" a été modifié en "${updateTacheStatutDto.type.replace(/_/g, ' ').toLowerCase()}"`,
        'tache_statut_change'
      );

      return tacheMiseAJour;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la mise à jour du statut de la tâche: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const tache = await this.findOne(id);
      await this.tacheRepository.remove(tache);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la suppression de la tâche: ${error.message}`);
    }
  }

  async findByEmploye(employeId: string): Promise<tache[]> {
    try {
      return await this.tacheRepository.find({
        where: {
          employeAssigne: { idUtilisateur: employeId },
        },
        relations: ['employeAssigne'],
      });
    } catch (error) {
      throw new BadRequestException(`Erreur lors de la récupération des tâches de l'employé: ${error.message}`);
    }
  }

  async getStatistiquesDuree(employeId?: string): Promise<any> {
    try {
      const where = employeId ? { employeAssigne: { idUtilisateur: employeId } } : {};

      const taches = await this.tacheRepository.find({
        where,
        relations: ['employeAssigne'],
      });

      const tachesTerminees = taches.filter(t => t.type === StatutTache.TERMINEE);
      const tachesEnCours = taches.filter(t =>
        t.type === StatutTache.EN_COURS || t.type === StatutTache.EN_ATTENTE
      );

      return {
        nombreTotalTaches: taches.length,
        nombreTachesTerminees: tachesTerminees.length,
        nombreTachesEnCours: tachesEnCours.length,
        dureeeMoyenneHeures:
          taches.length > 0
            ? taches.reduce((sum, t) => sum + (t.dureeEnHeures || 0), 0) / taches.length
            : 0,
        dureeeTotaleHeures: taches.reduce((sum, t) => sum + (t.dureeEnHeures || 0), 0),
        tauxReussite: taches.length > 0 ? (tachesTerminees.length / taches.length) * 100 : 0,
      };
    } catch (error) {
      throw new BadRequestException(`Erreur lors du calcul des statistiques: ${error.message}`);
    }
  }

  



  private async notifierEmploye(employeId: string, message: string, type: string): Promise<void> {
    try {
      // Récupérer les informations complètes de l'utilisateur
      const utilisateur = await this.utilisateurRepository.findOne({
        where: { idUtilisateur: employeId }
      });
      
      if (!utilisateur) {
        throw new Error(`Utilisateur avec ID ${employeId} non trouvé`);
      }
      
      // Déterminer le type d'action en fonction du message
      let action = "Notification de tâche";
      if (type === 'tache_assignee') {
        action = "Nouvelle tâche assignée";
      } else if (type === 'tache_statut_change') {
        action = "Changement de statut de tâche";
      } else if (type === 'tache_retard') {
        action = "⚠️ ALERTE RETARD DE TÂCHE";
      } else if (type === 'tache_expiree') {
        action = "🚨 TÂCHE EXPIRÉE";
      }
      
      // Extraire le titre de la tâche du message
      let title = message;
      const match = message.match(/"([^"]+)"/);
      if (match && match[1]) {
        title = match[1];
      }
      
      await this.notificationService.sendTaskNotification(utilisateur, title, action);
    } catch (error) {
      console.error(`Erreur lors de l'envoi de la notification: ${error.message}`);
      // On ne propage pas l'erreur pour ne pas bloquer le workflow principal
    }
  }
}