// import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, IsNull } from 'typeorm';
// import { Contrat } from './entities/contrat.entity';
// import { Utilisateur } from '../User/entities/utilisateur.entity';
// import { tache } from '../tache/entities/tache.entity';
// import { CreateContratDto } from './dto/create-contrat.dto';
// import { UpdateContratDto } from './dto/update-contrat.dto';
// import { AddTaskToContratDto } from './dto/add-task-to-contrat.dto';
// import { StatutTache } from '../tache/enums/statut-tache.enum';
// import * as moment from 'moment-timezone';
// import { Point } from '../utils/types/type';

// @Injectable()
// export class ContratService {
//   constructor(
//     @InjectRepository(Contrat)
//     private contratRepository: Repository<Contrat>,
//     @InjectRepository(Utilisateur)
//     private utilisateurRepository: Repository<Utilisateur>,
//     @InjectRepository(tache)
//     private tacheRepository: Repository<tache>,
//     // private notificationService: NotificationService, // À décommenter si vous avez ce service
//   ) {}

//   async findAll(): Promise<Contrat[]> {
//     return this.contratRepository.find({
//       where: { estGabarit: false, delete_at: IsNull() },
//       relations: ['utilisateur', 'taches', 'presence', 'alerte'],
//     });
//   }


//   async findContractsByEmployeeId(employeeId: string): Promise<Contrat[]> {
//     return this.contratRepository.find({
//       where: { utilisateur: { idUtilisateur: employeeId } },
//       relations: ['utilisateur', 'taches', 'presence', 'alerte'],
//     });
//   }

//   async findOne(id: string): Promise<Contrat> {
//     const contrat = await this.contratRepository.findOne({
//       where: { idContrat: id },
//       relations: ['utilisateur', 'taches', 'presence', 'alerte'],
//     });

//     if (!contrat) {
//       throw new NotFoundException(`Contrat avec l'ID ${id} non trouvé`);
//     }

//     return contrat;
//   }

//   async create(createContratDto: CreateContratDto, timezone: string = 'Europe/Paris'): Promise<Contrat[]> {
//     // Créer un contrat de base
//     const contrat = this.contratRepository.create({
//       ...createContratDto,
//       taches: [],
//     });

//     // Convertir les horaires en UTC si fournis
//     if (createContratDto.dateDebut) {
//       contrat.dateDebut = this.convertToUTC(createContratDto.dateDebut, timezone);
//     }
//     if (createContratDto.dateFin) {
//       contrat.dateFin = this.convertToUTC(createContratDto.dateFin, timezone);
//     }

//     // Créer le point géographique pour le lieu
//     if (createContratDto.longitude && createContratDto.latitude) {
//       contrat.lieu = {
//         type: 'Point',
//         coordinates: [createContratDto.longitude, createContratDto.latitude],
//       };
//     }

//     // Ajouter l'utilisateur si l'ID est fourni
//     if (createContratDto.utilisateurId) {
//       const utilisateur = await this.utilisateurRepository.findOne({
//         where: { idUtilisateur: createContratDto.utilisateurId },
//       });

//       if (!utilisateur) {
//         throw new NotFoundException(`Utilisateur avec l'ID ${createContratDto.utilisateurId} non trouvé`);
//       }

//       contrat.utilisateur = utilisateur;
      
//       // Vérifier les conflits d'horaires
//       await this.checkScheduleConflict(
//         createContratDto.utilisateurId,
//         contrat.dateDebut,
//         contrat.dateFin,
//         undefined,
//         timezone
//       );
//     }

//     // Ajouter les tâches si fournies
//     if (createContratDto.tachesIds && createContratDto.tachesIds.length > 0) {
//       const tasks = await this.tacheRepository.findByIds(createContratDto.tachesIds);

//       for (const task of tasks) {
//         task.type = StatutTache.EN_COURS;
//         await this.tacheRepository.save(task);
//       }

//       contrat.taches = tasks;
//     }

//     // Sauvegarder le contrat principal
//     const savedContrat = await this.contratRepository.save(contrat);
//     const createdContrats = [savedContrat];

//     // Envoyer notification SEULEMENT si le contrat commence aujourd'hui
//     if (contrat.utilisateur && this.isToday(contrat.dateDebut)) {
//       try {
//         // await this.notificationService.sendContractNotification(contrat.utilisateur, savedContrat);
//         console.log(`Notification immédiate envoyée pour le contrat d'aujourd'hui ${contrat.idContrat}`);
//       } catch (error) {
//         console.error(`Failed to send immediate notification:`, error);
//       }
//     }

//     // Gestion des contrats répétitifs
//     if (createContratDto.estRepetitif && createContratDto.nombreJoursRepetition) {
//       const dureeContrat = contrat.dateFin.getTime() - contrat.dateDebut.getTime();

//       for (let jour = 1; jour <= createContratDto.nombreJoursRepetition; jour++) {
//         try {
//           // Calculer les nouvelles dates
//           const nouvelleDate = new Date(contrat.dateDebut);
//           nouvelleDate.setDate(nouvelleDate.getDate() + jour);

//           const nouvelleDateFin = new Date(nouvelleDate.getTime() + dureeContrat);

//           // Vérifier les conflits d'horaires pour ce nouveau créneau
//           if (createContratDto.utilisateurId) {
//             await this.checkScheduleConflict(
//               createContratDto.utilisateurId,
//               nouvelleDate,
//               nouvelleDateFin,
//               undefined,
//               timezone
//             );
//           }

//           // Créer le contrat répété
//           const contratRepete = this.contratRepository.create({
//             ...createContratDto,
//             dateDebut: nouvelleDate,
//             dateFin: nouvelleDateFin,
//             utilisateur: contrat.utilisateur,
//             lieu: contrat.lieu,
//             estRepetitif: false, // Les contrats répétés ne sont pas eux-mêmes répétitifs
//             taches: [],
//           });

//           // Ajouter les tâches (créer des copies)
//           if (createContratDto.tachesIds && createContratDto.tachesIds.length > 0) {
//             const tasks = await this.tacheRepository.findByIds(createContratDto.tachesIds);
//             const newTasks: tache[] = [];

//             for (const task of tasks) {
//               const taskCopy = this.tacheRepository.create({
//                 ...task,
//                 idTache: undefined,
//                 type: StatutTache.EN_COURS,
//               });

//               const savedTask = await this.tacheRepository.save(taskCopy);
//               newTasks.push(savedTask);
//             }

//             contratRepete.taches = newTasks;
//           }

//           // Sauvegarder le contrat répété
//           const savedRepeatedContrat = await this.contratRepository.save(contratRepete);
//           createdContrats.push(savedRepeatedContrat);

//           // Envoyer notification SEULEMENT si le contrat répété commence aujourd'hui
//           if (contratRepete.utilisateur && this.isToday(contratRepete.dateDebut)) {
//             try {
//               // await this.notificationService.sendContractNotification(contratRepete.utilisateur, savedRepeatedContrat);
//               console.log(`Notification immédiate envoyée pour le contrat répété d'aujourd'hui`);
//             } catch (error) {
//               console.error(`Failed to send immediate notification for repeated contract:`, error);
//             }
//           }

//           console.log(`Contrat répété créé pour le ${nouvelleDate.toLocaleDateString()}`);

//         } catch (error) {
//           console.error(`Erreur lors de la création du contrat répété jour ${jour}:`, error);
//         }
//       }
//     }

//     console.log(`${createdContrats.length} contrat(s) créé(s).`);
//     return createdContrats;
//   }

//   // Méthode utilitaire pour vérifier si une date est aujourd'hui
//   private isToday(date: Date): boolean {
//     const today = new Date();
//     const checkDate = new Date(date);

//     return checkDate.getDate() === today.getDate() &&
//            checkDate.getMonth() === today.getMonth() &&
//            checkDate.getFullYear() === today.getFullYear();
//   }

//   /**
//    * Convertit une date en UTC en prenant en compte le fuseau horaire
//    */
//   private convertToUTC(date: Date | string, timezone: string = 'Europe/Paris'): Date {
//     return moment.tz(date, timezone).utc().toDate();
//   }

//   /**
//    * Vérifie s'il y a des conflits d'horaires pour un employé
//    */
//   private async checkScheduleConflict(
//     utilisateurId: string,
//     dateDebut: Date,
//     dateFin: Date,
//     excludeContratId?: string,
//     timezone: string = 'Europe/Paris'
//   ): Promise<void> {
//     if (!utilisateurId || !dateDebut || !dateFin) {
//       return;
//     }

//     // Convertir les horaires en UTC
//     const debutUTC = this.convertToUTC(dateDebut, timezone);
//     const finUTC = this.convertToUTC(dateFin, timezone);

//     // Vérifier que l'heure de fin est après l'heure de début
//     if (finUTC <= debutUTC) {
//       throw new ConflictException('L\'heure de fin doit être postérieure à l\'heure de début');
//     }

//     // Construire la requête pour trouver les conflits
//     const queryBuilder = this.contratRepository
//       .createQueryBuilder('contrat')
//       .where('contrat.utilisateurId = :utilisateurId', { utilisateurId })
//       .andWhere('contrat.dateDebut IS NOT NULL')
//       .andWhere('contrat.dateFin IS NOT NULL')
//       .andWhere(
//         '(contrat.dateDebut < :dateFin AND contrat.dateFin > :dateDebut)',
//         {
//           dateDebut: debutUTC,
//           dateFin: finUTC,
//         }
//       );

//     // Exclure le contrat actuel lors de la mise à jour
//     if (excludeContratId) {
//       queryBuilder.andWhere('contrat.idContrat != :excludeContratId', { excludeContratId });
//     }

//     const conflictingContrats = await queryBuilder.getMany();

//     if (conflictingContrats.length > 0) {
//       const conflictDetails = conflictingContrats.map(contrat => ({
//         id: contrat.idContrat,
//         debut: moment(contrat.dateDebut).tz(timezone).format('DD/MM/YYYY HH:mm'),
//         fin: moment(contrat.dateFin).tz(timezone).format('DD/MM/YYYY HH:mm'),
//         poste: contrat.poste,
//       }));

//       throw new ConflictException(
//         `L'employé a déjà un contrat programmé pendant cette période. Conflits détectés: ${JSON.stringify(conflictDetails)}`
//       );
//     }
//   }

//   async update(id: string, updateContratDto: UpdateContratDto, timezone: string = 'Europe/Paris'): Promise<Contrat> {
//     const contrat = await this.findOne(id);

//     // Préparer les nouvelles données
//     const updatedData = { ...contrat };
//     let utilisateurId = contrat.utilisateur?.idUtilisateur;

//     // Mettre à jour l'utilisateur si fourni
//     if (updateContratDto.utilisateurId) {
//       const user = await this.utilisateurRepository.findOne({
//         where: { idUtilisateur: updateContratDto.utilisateurId },
//       });

//       if (!user) {
//         throw new NotFoundException(`Utilisateur avec l'ID ${updateContratDto.utilisateurId} non trouvé`);
//       }

//       contrat.utilisateur = user;
//       utilisateurId = updateContratDto.utilisateurId;
//     }

//     // Mettre à jour les horaires et convertir en UTC
//     if (updateContratDto.dateDebut) {
//       updatedData.dateDebut = this.convertToUTC(updateContratDto.dateDebut, timezone);
//       contrat.dateDebut = updatedData.dateDebut;
//     }
//     if (updateContratDto.dateFin) {
//       updatedData.dateFin = this.convertToUTC(updateContratDto.dateFin, timezone);
//       contrat.dateFin = updatedData.dateFin;
//     }

//     // Mettre à jour le lieu si les coordonnées sont fournies
//     if (updateContratDto.longitude && updateContratDto.latitude) {
//       contrat.lieu = {
//         type: 'Point',
//         coordinates: [updateContratDto.longitude, updateContratDto.latitude],
//       };
//     }

//     // Vérifier les conflits d'horaires si un utilisateur est assigné
//     if (utilisateurId && (updatedData.dateDebut || updatedData.dateFin)) {
//       await this.checkScheduleConflict(
//         utilisateurId,
//         updatedData.dateDebut || contrat.dateDebut,
//         updatedData.dateFin || contrat.dateFin,
//         id,
//         timezone
//       );
//     }

//     // Mettre à jour les champs simples
//     contrat.description = updateContratDto.description || contrat.description;
//     contrat.pause = updateContratDto.pause || contrat.pause;
//     contrat.nomGabarit = updateContratDto.nomGabarit || contrat.nomGabarit;

//     // Mettre à jour les tâches si fournies
//     if (updateContratDto.tachesIds && updateContratDto.tachesIds.length > 0) {
//       const tasks = await this.tacheRepository.findByIds(updateContratDto.tachesIds);
//       contrat.taches = tasks;
//     }

//     // Sauvegarder et retourner le contrat mis à jour
//     return this.contratRepository.save(contrat);
//   }

//   async remove(id: string): Promise<void> {
//     try {
//       // Vérifier si le contrat existe
//       const contrat = await this.contratRepository.findOne({ where: { idContrat: id } });

//       if (!contrat) {
//         throw new NotFoundException(`Contrat avec l'ID ${id} non trouvé`);
//       }

//       // Vérifier si le contrat n'est pas déjà supprimé
//       if (contrat.delete_at !== null) {
//         throw new BadRequestException('Ce contrat est déjà supprimé');
//       }

//       // Effectuer la suppression logique
//       await this.contratRepository.softDelete(id);

//     } catch (error) {
//       if (error instanceof NotFoundException || error instanceof BadRequestException) {
//         throw error;
//       }
//       throw new InternalServerErrorException('Erreur lors de la suppression du contrat');
//     }
//   }

//   async restore(id: string): Promise<void> {
//     try {
//       const contrat = await this.contratRepository.findOne({ 
//         where: { idContrat: id },
//         withDeleted: true 
//       });

//       if (!contrat) {
//         throw new NotFoundException(`Contrat avec l'ID ${id} non trouvé`);
//       }

//       if (contrat.delete_at === null) {
//         throw new BadRequestException('Ce contrat n\'est pas supprimé');
//       }

//       await this.contratRepository.restore(id);

//     } catch (error) {
//       if (error instanceof NotFoundException || error instanceof BadRequestException) {
//         throw error;
//       }
//       throw new InternalServerErrorException('Erreur lors de la restauration du contrat');
//     }
//   }

//   formatContratForDisplay(contrat: Contrat, timezone: string = 'Europe/Paris'): any {
//     return {
//       ...contrat,
//       dateDebut: contrat.dateDebut 
//         ? moment(contrat.dateDebut).tz(timezone).format('YYYY-MM-DD HH:mm:ss')
//         : null,
//       dateFin: contrat.dateFin 
//         ? moment(contrat.dateFin).tz(timezone).format('YYYY-MM-DD HH:mm:ss')
//         : null,
//       coordinates: contrat.lieu ? contrat.lieu.coordinates : null,
//       timezone,
//     };
//   }

//   async addTaskToContrat(id: string, addTaskDto: AddTaskToContratDto): Promise<Contrat> {
//     const contrat = await this.findOne(id);
//     const task = await this.tacheRepository.findOne({
//       where: { idTache: addTaskDto.tacheId },
//     });

//     if (!task) {
//       throw new NotFoundException(`Tâche avec l'ID ${addTaskDto.tacheId} non trouvée`);
//     }

//     if (!contrat.taches) {
//       contrat.taches = [];
//     }

//     task.type = StatutTache.EN_COURS;
//     await this.tacheRepository.save(task);

//     contrat.taches.push(task);
//     return this.contratRepository.save(contrat);
//   }
// }