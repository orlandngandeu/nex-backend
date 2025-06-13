import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Contract } from './entities/contrat.entity';
import { tache } from '../tache/entities/tache.entity';
import { Utilisateur } from '../auth/auth.entity';
import { commentaire } from '../commentaire/entities/commentaire.entity';
import { Presence } from '../presence/entities/presence.entity';
import {
  CreateContractDto,
  UpdateContractDto,
  AddTaskToContractDto,
  CreateCommentDto,
  PointageContratDto,
  SaveAsTemplateDto,
  CreateFromTemplateDto,
} from './dto/create-contrat.dto';
import { NotificationService } from '../notification/notification.service';
import { IsNull, Not, Between} from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { Cron } from '@nestjs/schedule';
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { heuremois } from '../heure-mois/entities/heure-mois.entity';
import { StatutTache } from 'src/enums/StatutTache';


@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(tache)
    private tacheRepository: Repository<tache>,

    @InjectRepository(Utilisateur)
    private utilisateurRepository: Repository<Utilisateur>,
    @InjectRepository(commentaire)
    private commentaireRepository: Repository<commentaire>,
    @InjectRepository(Presence)
    private presenceRepository: Repository<Presence>,
    @InjectRepository(heuremois)
    private heureMoisRepository: Repository<heuremois>,
    private notificationService: NotificationService,
  
  ) {}

  async findAll(): Promise<Contract[]> {
    return this.contractRepository.find({
      where: { estGabarit: false }, // Exclure les gabarits
      relations: ['utilisateur', 'taches', 'equipements', 'commentaires'],
    });
  }
  async getTemplatesByPoste(poste: string): Promise<Contract[]> {
    return this.contractRepository.find({
      where: { estGabarit: true, poste: poste },
      relations: ['taches', 'equipements'],
    });
  }

  async findContractsByEmployeeId(employeeId: string): Promise<Contract[]> {
    return this.contractRepository.find({
      where: { utilisateur: { idUtilisateur: employeeId } },
      relations: ['utilisateur', 'taches', 'commentaires'],
    });
  }

  async findOne(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { idContrat: id },
      relations: ['utilisateur', 'taches',  'commentaires', 'commentaires.emetteur', 'commentaires.destinataire'],
    });

    if (!contract) {
      throw new NotFoundException(`Contrat avec l'ID ${id} non trouvé`);
    }

    return contract;
  }


  async create(createContractDto: CreateContractDto, timezone: string = 'Europe/Paris'): Promise<Contract[]> {
    // Créer un contrat de base
    const contract = this.contractRepository.create({
      ...createContractDto,
      taches: [],
    
    });
   
    // Convertir les horaires en UTC si fournis
    if (createContractDto.horaireDebut) {
      contract.horaireDebut = this.convertToUTC(createContractDto.horaireDebut, timezone);
    }
    if (createContractDto.horaireFin) {
      contract.horaireFin = this.convertToUTC(createContractDto.horaireFin, timezone);
    }
   
    // Ajouter l'utilisateur si l'ID est fourni
    if (createContractDto.utilisateurId) {
      const utilisateur = await this.utilisateurRepository.findOne({
        where: { idUtilisateur: createContractDto.utilisateurId },
      });
     
      if (!utilisateur) {
        throw new NotFoundException(`Utilisateur avec l'ID ${createContractDto.utilisateurId} non trouvé`);
      }
     
      contract.utilisateur = utilisateur;
      // Vérifier les conflits d'horaires
      await this.checkScheduleConflict(
        createContractDto.utilisateurId,
        contract.horaireDebut,
        contract.horaireFin,
        undefined,
        timezone
      );
    }
   
    // Ajouter les tâches si fournies
    if (createContractDto.tachesIds && createContractDto.tachesIds.length > 0) {
      const tasks = await this.tacheRepository.findByIds(createContractDto.tachesIds);
     
      for (const task of tasks) {
        task.type = StatutTache.EN_COURS; // Marquer la tâche comme en cours
        await this.tacheRepository.save(task);
      }
     
      contract.taches = tasks;
    }
   
    // Sauvegarder le contrat principal
    const savedContract = await this.contractRepository.save(contract);
    const createdContracts = [savedContract];
   
    // Envoyer notification SEULEMENT si le contrat commence aujourd'hui
    if (contract.utilisateur && this.isToday(contract.horaireDebut)) {
      try {
        await this.notificationService.sendContractNotification(contract.utilisateur, savedContract);
        console.log(`Notification immédiate envoyée pour le contrat d'aujourd'hui ${contract.idContrat}`);
      } catch (error) {
        console.error(`Failed to send immediate notification:`, error);
        // Ne pas faire échouer la création
      }
    }

    // 
    if (createContractDto.estRepetitif && createContractDto.nombreJoursRepetition) {
      const dureeContrat = contract.horaireFin.getTime() - contract.horaireDebut.getTime();
      
      for (let jour = 1; jour <= createContractDto.nombreJoursRepetition; jour++) {
        try {
          // Calculer les nouvelles dates (ajouter un jour à chaque fois)
          const nouvelleDate = new Date(contract.horaireDebut);
          nouvelleDate.setDate(nouvelleDate.getDate() + jour);
          
          const nouvelleDateFin = new Date(nouvelleDate.getTime() + dureeContrat);

          // Vérifier les conflits d'horaires pour ce nouveau créneau
          if (createContractDto.utilisateurId) {
            await this.checkScheduleConflict(
              createContractDto.utilisateurId,
              nouvelleDate,
              nouvelleDateFin,
              undefined,
              timezone
            );
          }

          // Créer le contrat répété
          const contractRepete = this.contractRepository.create({
            ...createContractDto,
            horaireDebut: nouvelleDate,
            horaireFin: nouvelleDateFin,
            utilisateur: contract.utilisateur,
            contratParentId: savedContract.idContrat,
            estRepetitif: false, // Les contrats répétés ne sont pas eux-mêmes répétitifs
            taches: [],
         
          });

          // Ajouter les tâches (créer des copies)
          if (createContractDto.tachesIds && createContractDto.tachesIds.length > 0) {
            const tasks = await this.tacheRepository.findByIds(createContractDto.tachesIds);
            const newTasks: tache[] = [];
          
            for (const task of tasks) {
              const taskCopy = this.tacheRepository.create({
                ...task,
                idTache: undefined, // ou null selon votre DB
                type: StatutTache.EN_COURS, // Marquer la tâche comme en cours
              });
          
              const savedTask = await this.tacheRepository.save(taskCopy);
              newTasks.push(savedTask);
            }
          
            contractRepete.taches = newTasks;
          }
          

          // Sauvegarder le contrat répété
          const savedRepeatedContract = await this.contractRepository.save(contractRepete);
          createdContracts.push(savedRepeatedContract);

          // Envoyer notification SEULEMENT si le contrat répété commence aujourd'hui
          if (contractRepete.utilisateur && this.isToday(contractRepete.horaireDebut)) {
            try {
              await this.notificationService.sendContractNotification(contractRepete.utilisateur, savedRepeatedContract);
              console.log(`Notification immédiate envoyée pour le contrat répété d'aujourd'hui`);
            } catch (error) {
              console.error(`Failed to send immediate notification for repeated contract:`, error);
              // Ne pas faire échouer la création
            }
          }

          console.log(`Contrat répété créé pour le ${nouvelleDate.toLocaleDateString()} - Notification programmée`);

        } catch (error) {
          console.error(`Erreur lors de la création du contrat répété jour ${jour}:`, error);
          // Continuer avec les autres jours même si un échoue
        }
      }

      // Mettre à jour le compteur de répétitions créées
      savedContract.repetitionsCreees = createdContracts.length - 1; // -1 car on ne compte pas le contrat principal
      await this.contractRepository.save(savedContract);
    }
   
    console.log(`${createdContracts.length} contrat(s) créé(s). Les notifications seront envoyées automatiquement chaque jour à 7h.`);
    return createdContracts;
}

// Méthode utilitaire pour vérifier si une date est aujourd'hui
private isToday(date: Date): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  
  return checkDate.getDate() === today.getDate() &&
         checkDate.getMonth() === today.getMonth() &&
         checkDate.getFullYear() === today.getFullYear();
}
  
  /**
   * Convertit une date en UTC en prenant en compte le fuseau horaire
   */
  private convertToUTC(date: Date | string, timezone: string = 'Europe/Paris'): Date {
    return moment.tz(date, timezone).utc().toDate();
  }

  /**
   * Vérifie s'il y a des conflits d'horaires pour un employé
   */
  private async checkScheduleConflict(
    utilisateurId: string,
    horaireDebut: Date,
    horaireFin: Date,
    excludeContractId?: string,
    timezone: string = 'Europe/Paris'
  ): Promise<void> {
    if (!utilisateurId || !horaireDebut || !horaireFin) {
      return; // Pas de vérification si les données ne sont pas complètes
    }

    // Convertir les horaires en UTC
    const debutUTC = this.convertToUTC(horaireDebut, timezone);
    const finUTC = this.convertToUTC(horaireFin, timezone);

    // Vérifier que l'heure de fin est après l'heure de début
    if (finUTC <= debutUTC) {
      throw new ConflictException('L\'heure de fin doit être postérieure à l\'heure de début');
    }

    // Construire la requête pour trouver les conflits
    const queryBuilder = this.contractRepository
      .createQueryBuilder('contract')
      .where('contract.utilisateurId = :utilisateurId', { utilisateurId })
      .andWhere('contract.horaireDebut IS NOT NULL')
      .andWhere('contract.horaireFin IS NOT NULL')
      .andWhere(
        '(contract.horaireDebut < :horaireFin AND contract.horaireFin > :horaireDebut)',
        {
          horaireDebut: debutUTC,
          horaireFin: finUTC,
        }
      );

    // Exclure le contrat actuel lors de la mise à jour
    if (excludeContractId) {
      queryBuilder.andWhere('contract.idContrat != :excludeContractId', { excludeContractId });
    }

    const conflictingContracts = await queryBuilder.getMany();

    if (conflictingContracts.length > 0) {
      const conflictDetails = conflictingContracts.map(contract => ({
        id: contract.idContrat,
        debut: moment(contract.horaireDebut).tz(timezone).format('DD/MM/YYYY HH:mm'),
        fin: moment(contract.horaireFin).tz(timezone).format('DD/MM/YYYY HH:mm'),
        lieu: contract.lieu,
      }));

      throw new ConflictException(
        `L'employé a déjà un contrat programmé pendant cette période. Conflits détectés: ${JSON.stringify(conflictDetails)}`
      );
    }
  }

  async update(id: string, updateContractDto: UpdateContractDto, timezone: string = 'Europe/Paris'): Promise<Contract> {
    const contract = await this.findOne(id);

    // Préparer les nouvelles données
    const updatedData = { ...contract };
    let utilisateurId = contract.utilisateur?.idUtilisateur;

    // Mettre à jour l'utilisateur si fourni
    if (updateContractDto.utilisateurId) {
      const user = await this.utilisateurRepository.findOne({
        where: { idUtilisateur: updateContractDto.utilisateurId },
      });

      if (!user) {
        throw new NotFoundException(`Utilisateur avec l'ID ${updateContractDto.utilisateurId} non trouvé`);
      }

      contract.utilisateur = user;
      utilisateurId = updateContractDto.utilisateurId;
    }

    // Mettre à jour les horaires et convertir en UTC
    if (updateContractDto.horaireDebut) {
      updatedData.horaireDebut = this.convertToUTC(updateContractDto.horaireDebut, timezone);
      contract.horaireDebut = updatedData.horaireDebut;
    }
    if (updateContractDto.horaireFin) {
      updatedData.horaireFin = this.convertToUTC(updateContractDto.horaireFin, timezone);
      contract.horaireFin = updatedData.horaireFin;
    }

    // Vérifier les conflits d'horaires si un utilisateur est assigné
    if (utilisateurId && (updatedData.horaireDebut || updatedData.horaireFin)) {
      await this.checkScheduleConflict(
        utilisateurId,
        updatedData.horaireDebut || contract.horaireDebut,
        updatedData.horaireFin || contract.horaireFin,
        id, // Exclure le contrat actuel
        timezone
      );
    }

    // Mettre à jour les champs simples
    contract.lieu = updateContractDto.lieu || contract.lieu;
    contract.description = updateContractDto.description || contract.description;
    contract.poste = updateContractDto.poste || contract.poste;
    contract.pause = updateContractDto.pause || contract.pause;

    // Mettre à jour les tâches si fournies
    if (updateContractDto.tachesIds && updateContractDto.tachesIds.length > 0) {
      const tasks = await this.tacheRepository.findByIds(updateContractDto.tachesIds);
      contract.taches = tasks;
    }

    // Sauvegarder et retourner le contrat mis à jour
    return this.contractRepository.save(contract);
  }

  async remove(id: string): Promise<void> {
    const contract = await this.findOne(id);
    await this.contractRepository.remove(contract);
  }
  formatContractForDisplay(contract: Contract, timezone: string = 'Europe/Paris'): any {
    return {
      ...contract,
      horaireDebut: contract.horaireDebut 
        ? moment(contract.horaireDebut).tz(timezone).format('YYYY-MM-DD HH:mm:ss')
        : null,
      horaireFin: contract.horaireFin 
        ? moment(contract.horaireFin).tz(timezone).format('YYYY-MM-DD HH:mm:ss')
        : null,
      timezone,
    };
  }

  async addTaskToContract(id: string, addTaskDto: AddTaskToContractDto): Promise<Contract> {
    const contract = await this.findOne(id);
    const task = await this.tacheRepository.findOne({
      where: { idTache: addTaskDto.tacheId },
    });
    
    if (!task) {
      throw new NotFoundException(`Tâche avec l'ID ${addTaskDto.tacheId} non trouvée`);
    }
    
    if (!contract.taches) {
      contract.taches = [];
    }
    
   
    task.type = StatutTache.EN_COURS; // Marquer la tâche comme en cours
    await this.tacheRepository.save(task);
    
    contract.taches.push(task);
    return this.contractRepository.save(contract);
  }

  async addCommentToContract(contractId: string, commentDto: CreateCommentDto): Promise<commentaire> {
    const contract = await this.findOne(contractId);
  
    const emetteur = await this.utilisateurRepository.findOne({
      where: { idUtilisateur: commentDto.emetteurId },
    });
    
    if (!emetteur) {
      throw new NotFoundException(`Émetteur avec l'ID ${commentDto.emetteurId} non trouvé`);
    }
    
    const destinataire = await this.utilisateurRepository.findOne({
      where: { idUtilisateur: commentDto.destinataireId },
    });
    
    if (!destinataire) {
      throw new NotFoundException(`Destinataire avec l'ID ${commentDto.destinataireId} non trouvé`);
    }

    const commentaire = this.commentaireRepository.create({
      contenu: commentDto.contenu,
      fichierJoint: commentDto.fichierJoint,
      emetteur,
      destinataire,
      contrat: contract,
      dateEnvoi: new Date(),
    });

    const savedComment = await this.commentaireRepository.save(commentaire);

    // Notifier le destinataire
    await this.notificationService.sendCommentNotification(destinataire, commentaire.contenu);

    return savedComment;
  }
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  async pointagePresence(contractId: string, pointageDto: PointageContratDto): Promise<Presence> {
    const contract = await this.findOne(contractId);

    const now = new Date();

const matchingContract = await this.contractRepository.findOne({
  where: {
    utilisateur: { idUtilisateur: pointageDto.utilisateurId },
    horaireDebut: LessThanOrEqual(now),
    horaireFin: MoreThanOrEqual(now),
  },
});

if (!matchingContract) {
  throw new BadRequestException("Aucun contrat actif pour l'heure actuelle.");
}

if (matchingContract.idContrat !== contract.idContrat) {
  throw new BadRequestException("Vous essayez de pointer un contrat qui n'est pas actif actuellement.");
}

    
    // Vérifier si le contrat est déjà terminé
    if (contract.estTermine) {
      throw new BadRequestException('Ce contrat est déjà terminé. Aucun nouveau pointage n\'est autorisé.');
    }
  
    const user = await this.utilisateurRepository.findOne({
      where: { idUtilisateur: pointageDto.utilisateurId }
    });
   
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${pointageDto.utilisateurId} non trouvé`);
    }
    
    // Vérifier la distance entre la position actuelle et celle du contrat
    if (
      !Array.isArray(pointageDto.localisation) ||
      pointageDto.localisation.length !== 2
    ) {
      throw new BadRequestException('Localisation invalide (latitude, longitude requis)');
    }
   
    const [userLat, userLng] = pointageDto.localisation;
    const [contractLat, contractLng] = contract.lieu;
   
    const distance = this.calculateDistance(userLat, userLng, contractLat, contractLng);
   
    // Si la distance est supérieure à 500m, rejeter le pointage
    if (distance > 500) {
      throw new Error(`Pointage impossible: vous êtes à ${Math.round(distance)}m du lieu de travail, la limite est de 500m`);
    }
    
    // Vérifier s'il existe déjà un pointage sans heure de départ
    const existingPresence = await this.presenceRepository.findOne({
      where: {
        utilisateur: { idUtilisateur: user.idUtilisateur },
        contrat: { idContrat: contract.idContrat },
        heureDepart: IsNull(),
      },
    });
    
    if (existingPresence) {
      // S'il existe un pointage sans départ, mettre à jour l'heure de départ
      const currentTime = pointageDto.heureDepart ? new Date(pointageDto.heureDepart) : new Date();
      existingPresence.heureDepart = currentTime;
      existingPresence.localisationDepart = pointageDto.localisation;
      
      // Vérifier si l'employé part avant l'heure de fin prévue
      const horaireFin = new Date(contract.horaireFin);
      
      // Créer un objet Date avec la date du jour courant mais l'heure de fin du contrat
      const today = new Date(currentTime);
      const finPrevue = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        horaireFin.getHours(),
        horaireFin.getMinutes()
      );
      
      // Calculer la différence en minutes
      const diffMilliseconds = currentTime.getTime() - finPrevue.getTime();
      const diffMinutes = Math.round(diffMilliseconds / 60000);
      
      // Préparer le message pour le départ
      let messageDepart = "";
      if (diffMinutes < 0) {
        // Si l'employé part avant l'heure de fin prévue
        const absMinutes = Math.abs(diffMinutes);
        const heuresDepart = Math.floor(absMinutes / 60);
        const minutesDepart = absMinutes % 60;
        
        messageDepart = "Départ anticipé de ";
        if (heuresDepart > 0) {
          messageDepart += `${heuresDepart} heure${heuresDepart > 1 ? 's' : ''}`;
          if (minutesDepart > 0) {
            messageDepart += ` et ${minutesDepart} minute${minutesDepart > 1 ? 's' : ''}`;
          }
        } else {
          messageDepart += `${minutesDepart} minute${minutesDepart > 1 ? 's' : ''}`;
        }
        messageDepart += " avant l'heure de fin prévue.";
      } else if (diffMinutes > 0) {
        // Si l'employé fait des heures supplémentaires
        const heuresSup = Math.floor(diffMinutes / 60);
        const minutesSup = diffMinutes % 60;
        
        messageDepart = "Heures supplémentaires effectuées: ";
        if (heuresSup > 0) {
          messageDepart += `${heuresSup} heure${heuresSup > 1 ? 's' : ''}`;
          if (minutesSup > 0) {
            messageDepart += ` et ${minutesSup} minute${minutesSup > 1 ? 's' : ''}`;
          }
        } else {
          messageDepart += `${minutesSup} minute${minutesSup > 1 ? 's' : ''}`;
        }
        messageDepart += ".";
      }
      
      // Ajouter le message de départ aux remarques existantes
      if (messageDepart) {
        if (existingPresence.remarques) {
          existingPresence.remarques += ' ' + messageDepart;
        } else {
          existingPresence.remarques = messageDepart;
        }
      }
      
      // NOUVEAU : Marquer le contrat comme terminé lors du pointage de départ
      contract.estTermine = true;
      await this.contractRepository.save(contract); // Sauvegarder le contrat modifié
      
      return this.presenceRepository.save(existingPresence);
    } else {
      // Vérifier si l'utilisateur a déjà pointé aujourd'hui et a bien départé
      const today = new Date();
      today.setHours(0, 0, 0, 0);
     
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
     
      const hasPointedToday = await this.presenceRepository.findOne({
        where: {
          utilisateur: { idUtilisateur: user.idUtilisateur },
          contrat: { idContrat: contract.idContrat },
          heureArrivee: Between(today, tomorrow),
        },
      });
     
      if (hasPointedToday) {
        throw new Error('Vous avez déjà pointé aujourd\'hui. Un seul pointage d\'arrivée et de départ est autorisé par jour.');
      }
     
      // Créer un nouveau pointage d'arrivée
      const currentTime = new Date();
      const presence = this.presenceRepository.create({
        utilisateur: user,
        contrat: contract,
        heureArrivee: currentTime,
        localisationArrivee: pointageDto.localisation,
      });
      
      // Vérifier si l'employé est en retard
      const horaireDebut = new Date(contract.horaireDebut);
      
      // Créer un objet Date avec la date du jour courant mais l'heure de début du contrat
      const debutPrevu = new Date(
        currentTime.getFullYear(),
        currentTime.getMonth(),
        currentTime.getDate(),
        horaireDebut.getHours(),
        horaireDebut.getMinutes()
      );
      
      // Calculer la différence totale en minutes (heures + minutes)
      const diffMilliseconds = currentTime.getTime() - debutPrevu.getTime();
      const diffMinutes = Math.round(diffMilliseconds / 60000);
      
      if (diffMinutes > 0) {
        // Si l'employé est en retard, calculer les heures et minutes
        const heuresRetard = Math.floor(diffMinutes / 60);
        const minutesRetard = diffMinutes % 60;
        
        let messageRetard = "Arrivée avec ";
        if (heuresRetard > 0) {
          messageRetard += `${heuresRetard} heure${heuresRetard > 1 ? 's' : ''}`;
          if (minutesRetard > 0) {
            messageRetard += ` et ${minutesRetard} minute${minutesRetard > 1 ? 's' : ''}`;
          }
        } else {
          messageRetard += `${minutesRetard} minute${minutesRetard > 1 ? 's' : ''}`;
        }
        messageRetard += " de retard.";
        
        presence.remarques = messageRetard;
      }
      
      return this.presenceRepository.save(presence);
    }
  }
  // Exécuter toutes les 15 minutes pour vérifier les contrats qui devraient être terminés
  @Cron('0 */15 * * * *') // Toutes les 15 minutes
  async checkAndTerminateContracts() {
    console.log('Vérification des contrats à terminer automatiquement...');
    
    const now = new Date();
    
    // Trouver tous les contrats non terminés dont l'heure de fin est dépassée
    const contractsToTerminate = await this.contractRepository
      .createQueryBuilder('contract')
      .where('contract.estTermine = :estTermine', { estTermine: false })
      .andWhere('contract.horaireFin < :now', { now })
      .getMany();

    for (const contract of contractsToTerminate) {
      // Vérifier s'il y a des présences actives (sans heure de départ) pour ce contrat
      const activePresences = await this.presenceRepository.find({
        where: {
          contrat: { idContrat: contract.idContrat },
          heureDepart: IsNull(),
        },
        relations: ['utilisateur'],
      });

      // Terminer automatiquement les présences actives
      for (const presence of activePresences) {
        presence.heureDepart = now;
        presence.localisationDepart = presence.localisationArrivee; // Utiliser la même localisation
        
        // Ajouter une remarque indiquant la fin automatique par le système
        const remarqueAuto = " Contrat arrêté automatiquement par le système à l'heure prévue.";
        if (presence.remarques) {
          presence.remarques += remarqueAuto;
        } else {
          presence.remarques = remarqueAuto;
        }
        
        await this.presenceRepository.save(presence);
      }

      // Marquer le contrat comme terminé
      contract.estTermine = true;
      await this.contractRepository.save(contract);
      
      console.log(`Contrat ${contract.idContrat} terminé automatiquement`);
    }
  }

  async getContractPresences(contractId: string): Promise<Presence[]> {
    const contract = await this.findOne(contractId);
    
    return this.presenceRepository.find({
      where: { contrat: { idContrat: contract.idContrat } },
      relations: ['utilisateur'],
    });
  }

async findAllPresences(): Promise<Presence[]> {
  return this.presenceRepository.find({
    relations: ['utilisateur', 'contrat'],
  });
}

async findPresencesByEmployeeId(employeeId: string): Promise<Presence[]> {
  const utilisateur = await this.utilisateurRepository.findOne({
    where: { idUtilisateur: employeeId },
  });

  if (!utilisateur) {
    throw new NotFoundException(`Utilisateur avec l'ID ${employeeId} non trouvé`);
  }

  return this.presenceRepository.find({
    where: { utilisateur: { idUtilisateur: employeeId } },
    relations: ['contrat', 'utilisateur'],
  });
}
async saveAsTemplate(contractId: string, saveDto: SaveAsTemplateDto): Promise<Contract> {
  const contract = await this.findOne(contractId);
  
  // Créer une copie du contrat comme gabarit
  const template = this.contractRepository.create({
    lieu: contract.lieu,
    horaireDebut: contract.horaireDebut,
    horaireFin: contract.horaireFin,
    description: contract.description,
    poste: contract.poste,
    pause: contract.pause,
    estGabarit: true, // Marquer comme gabarit
    nomGabarit: saveDto.nomGabarit,
    taches: contract.taches,
    // Ne pas copier les commentaires ou l'utilisateur
  });
  
  // Sauvegarder le gabarit
  return this.contractRepository.save(template);
}

async getAllTemplates(): Promise<Contract[]> {
  return this.contractRepository.find({
    where: { estGabarit: true },
    relations: ['taches',],
  });
}

async createFromTemplate(createDto: CreateFromTemplateDto): Promise<Contract> {
  // Récupérer le gabarit
  const template = await this.contractRepository.findOne({
    where: { idContrat: createDto.gabaritId, estGabarit: true },
    relations: ['taches', 'equipements'],
  });
  
  if (!template) {
    throw new NotFoundException(`Gabarit avec l'ID ${createDto.gabaritId} non trouvé`);
  }
  
  // Récupérer l'utilisateur
  const utilisateur = await this.utilisateurRepository.findOne({
    where: { idUtilisateur: createDto.utilisateurId },
  });
  
  if (!utilisateur) {
    throw new NotFoundException(`Utilisateur avec l'ID ${createDto.utilisateurId} non trouvé`);
  }
  
  // Vérifier la compatibilité du poste
  if (utilisateur.poste !== template.poste) {
    throw new BadRequestException(`Le poste ${template.poste} du contrat ne correspond pas au poste ${utilisateur.poste} de l'employé`);
  }
  
  // Créer un nouveau contrat à partir du gabarit
  const newContract = this.contractRepository.create({
    lieu: template.lieu,
    horaireDebut: template.horaireDebut,
    horaireFin: template.horaireFin,
    description: template.description,
    poste: template.poste,
    pause: template.pause,
    estGabarit: false, // Ce n'est pas un gabarit
    utilisateur: utilisateur,
    taches: template.taches,
    // Ne pas copier les commentaires
  });
  
  // Sauvegarder le nouveau contrat
  const savedContract = await this.contractRepository.save(newContract);
  
  // Envoyer une notification à l'employé
  try {
    await this.notificationService.sendContractNotification(utilisateur, savedContract);
    console.log(`Notification sent to employee ${utilisateur.idUtilisateur}`);
  } catch (error) {
    console.error(`Failed to send notification to employee ${utilisateur.idUtilisateur}:`, error);
    // Vous pouvez choisir de gérer l'erreur ici
  }
  
  return savedContract;
}
async obtenirHeuresTravailEmployes(idEmploye?: string): Promise<any[]> {
  // Récupérer toutes les présences avec leurs relations
  const requete = this.presenceRepository.createQueryBuilder('presence')
    .leftJoinAndSelect('presence.utilisateur', 'utilisateur')
    .leftJoinAndSelect('presence.contrat', 'contrat')
    .where('presence.heureArrivee IS NOT NULL AND presence.heureDepart IS NOT NULL');
  
  // Filtrer par employé si un ID est fourni
  if (idEmploye) {
    requete.andWhere('utilisateur.idUtilisateur = :idEmploye', { idEmploye });
  }
  
  const presences = await requete.getMany();
  
  // Regrouper les présences par employé
  const mapEmployes = new Map();
  
  presences.forEach(presence => {
    if (!presence.utilisateur) return;
    
    const idEmploye = presence.utilisateur.idUtilisateur;
    const nomEmploye = `${presence.utilisateur.nom}`;
    
    if (!mapEmployes.has(idEmploye)) {
      mapEmployes.set(idEmploye, {
        idEmploye,
        nomEmploye,
        heuresTotal: 0,
        details: []
      });
    }
    
    // Calculer les heures travaillées pour cette présence
    if (presence.heureArrivee && presence.heureDepart) {
      const heureDebut = new Date(presence.heureArrivee);
      const heureFin = new Date(presence.heureDepart);
      const diffMs = heureFin.getTime() - heureDebut.getTime();
      const heures = diffMs / (1000 * 60 * 60); // Conversion en heures
      
      mapEmployes.get(idEmploye).heuresTotal += heures;
      
      // Ajouter les détails pour cette présence
      mapEmployes.get(idEmploye).details.push({
        date: heureDebut.toISOString().split('T')[0],
        idContrat: presence.contrat?.idContrat || 'N/A',
        titreContrat: presence.contrat?.description || 'N/A',
        heureDebut: heureDebut.toISOString(),
        heureFin: heureFin.toISOString(),
        heures: parseFloat(heures.toFixed(2))
      });
    }
  });
  
  // Convertir la map en tableau
  return Array.from(mapEmployes.values());
}

async calculerEtStockerHeuresMensuelles(idEmploye: string, mois: number, annee: number): Promise<any> {
  // Validation des entrées
  if (mois < 1 || mois > 12) {
    throw new BadRequestException('Le mois doit être compris entre 1 et 12');
  }
  
  // Trouver l'utilisateur
  const utilisateur = await this.utilisateurRepository.findOne({
    where: { idUtilisateur: idEmploye },
  });

  if (!utilisateur) {
    throw new NotFoundException(`Utilisateur avec l'ID ${idEmploye} non trouvé`);
  }

  // Définir les dates de début et de fin du mois
  const debutMois = new Date(annee, mois - 1, 1);
  const finMois = new Date(annee, mois, 0, 23, 59, 59);
  
  // Récupérer toutes les présences de l'employé pour ce mois
  const presences = await this.presenceRepository.find({
    where: {
      utilisateur: { idUtilisateur: idEmploye },
      heureArrivee: Between(debutMois, finMois),
      heureDepart: Not(IsNull()), // Ne compter que les présences complètes
    },
    relations: ['contrat'],
  });
  
  // Calculer le total des heures travaillées
  let totalHeures = 0;
  
  presences.forEach(presence => {
    if (presence.heureArrivee && presence.heureDepart) {
      const heureDebut = new Date(presence.heureArrivee);
      const heureFin = new Date(presence.heureDepart);
      const diffMs = heureFin.getTime() - heureDebut.getTime();
      const heures = diffMs / (1000 * 60 * 60); // Conversion en heures
      
      // Si le contrat a une pause définie, la soustraire
      if (presence.contrat && typeof presence.contrat.pause === 'number') {
        const pauseHeures = presence.contrat.pause / 60;
        totalHeures += Math.max(0, heures - pauseHeures);
      } else {
        totalHeures += heures;
      }
    }
  });
  
  // Arrondir à 2 décimales
  totalHeures = parseFloat(totalHeures.toFixed(2));
  
  // Vérifier si une entrée pour ce mois existe déjà
  const existingRecord = await this.heureMoisRepository.findOne({
    where: {
      employesHeure: { idUtilisateur: idEmploye },
      mois: mois,
      annee: annee,
      heuresMensuelles: Not(IsNull()),
    },
  });
  
  if (existingRecord) {
    // Mettre à jour l'enregistrement existant
    existingRecord.heuresMensuelles = totalHeures;
    await this.heureMoisRepository.save(existingRecord);
    return existingRecord;
  } else {
    // Créer un nouvel enregistrement de synthèse
    const synthesePresence = this.heureMoisRepository.create({
      employesHeure: utilisateur,
      mois: mois,
      annee: annee,
      heuresMensuelles: totalHeures,
      // Champs obligatoires avec valeurs par défaut
      //heureArrivee: debutMois, // Début du mois comme référence
      // Les autres champs sont nullables
    });
    
    return this.heureMoisRepository.save(synthesePresence);
  }
}

// Méthode pour récupérer les heures mensuelles
async obtenirHeuresMensuelles(idEmploye?: string, mois?: number, annee?: number): Promise<any[]> {
  // Construire la requête de base
  const query = this.heureMoisRepository.createQueryBuilder('presence')
    .leftJoinAndSelect('presence.utilisateur', 'utilisateur')
    .where('presence.heuresMensuelles IS NOT NULL');
  
  // Ajouter les filtres si fournis
  if (idEmploye) {
    query.andWhere('utilisateur.idUtilisateur = :idEmploye', { idEmploye });
  }
  
  if (mois) {
    query.andWhere('presence.mois = :mois', { mois });
  }
  
  if (annee) {
    query.andWhere('presence.annee = :annee', { annee });
  }
  
  // Exécuter la requête
  const records = await query.getMany();
  
  // Formater les résultats
  return records.map(record => ({
    idEmploye: record.employesHeure.idUtilisateur,
    nomEmploye: record.employesHeure.nom,
    mois: record.mois,
    annee: record.annee,
    heuresMensuelles: record.heuresMensuelles,
  }));
}

// Fonction utilitaire pour recalculer les heures mensuelles pour tous les employés
async recalculerToutesHeuresMensuelles(mois: number, annee: number): Promise<void> {
  // Récupérer tous les utilisateurs
  const utilisateurs = await this.utilisateurRepository.find();
  
  // Pour chaque utilisateur, calculer les heures mensuelles
  for (const utilisateur of utilisateurs) {
    await this.calculerEtStockerHeuresMensuelles(utilisateur.idUtilisateur, mois, annee);
  }
}
async findContractsByCompanyId(companyId: number): Promise<Contract[]> {
  // Récupérer tous les utilisateurs associés à cette entreprise
  const utilisateurs = await this.utilisateurRepository.find({
    where: { entreprise: { idEtreprise: companyId } }
  });
  
  // Récupérer les IDs des utilisateurs
  const utilisateurIds = utilisateurs.map(user => user.idUtilisateur);
  
  // Récupérer tous les contrats associés à ces utilisateurs
  return this.contractRepository.find({
    where: { 
      utilisateur: { idUtilisateur: In(utilisateurIds) },
      estGabarit: false // Exclure les gabarits si nécessaire
    },
    relations: ['utilisateur', 'taches', 'equipements', 'commentaires'],
  });
}
}
