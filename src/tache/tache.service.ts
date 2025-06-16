import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { tache } from './entities/tache.entity';
import { CreateTacheDto } from './dto/create-tache.dto';
import { UpdateTacheDto } from './dto/update-tache.dto';
import { QueryTacheDto } from './dto/query-tache.dto';
import { Priorite, StatutTache } from 'src/utils/enums/enums';
import * as ExcelJS from 'exceljs';

@Injectable()
export class TacheService {
  constructor(
    @InjectRepository(tache)
    private readonly tacheRepository: Repository<tache>,
  ) {}

  // Créer une tâche liée à un contrat
  async create(createTacheDto: CreateTacheDto): Promise<tache> {
    try {
      const nouvelleTache = this.tacheRepository.create({
        ...createTacheDto,
        priorite: createTacheDto.priorite || Priorite.MOYENNE,
      });

      return await this.tacheRepository.save(nouvelleTache);
    } catch (error) {
      throw new BadRequestException('Erreur lors de la création de la tâche');
    }
  }

  // Récupérer toutes les tâches (non supprimées)
  async findAll(queryDto?: QueryTacheDto): Promise<tache[]> {
    const query = this.tacheRepository.createQueryBuilder('tache')
      .where('tache.delete_at IS NULL');

    if (queryDto?.priorite) {
      query.andWhere('tache.priorite = :priorite', { priorite: queryDto.priorite });
    }

    if (queryDto?.statut) {
      query.andWhere('tache.type = :statut', { statut: queryDto.statut });
    }

    return await query.getMany();
  }

  // Récupérer une tâche par ID (non supprimée)
  async findOne(id: string): Promise<tache> {
    const tacheFound = await this.tacheRepository.findOne({
      where: { 
        idTache: id,
        delete_at: IsNull()
      }
    });

    if (!tacheFound) {
      throw new NotFoundException(`Tâche avec l'ID ${id} non trouvée`);
    }

    return tacheFound;
  }

//   // Lister toutes les tâches d'un employé sur une période
//   async findByEmployeAndPeriod(
//     employeId: string,
//     dateDebut: Date,
//     dateFin: Date
//   ): Promise<tache[]> {
//     return await this.tacheRepository.find({
//       where: {
//         // Vous devrez ajouter la relation employé dans votre entité
//         // employeId: employeId,
//         dateCreation: Between(dateDebut, dateFin),
//         delete_at: IsNull()
//       },
//       order: { dateCreation: 'DESC' }
//     });
//   }

  // Lister toutes les tâches par priorité ou statut
  async findByPrioriteOrStatut(
    priorite?: Priorite,
    statut?: StatutTache
  ): Promise<tache[]> {
    const query = this.tacheRepository.createQueryBuilder('tache')
      .where('tache.delete_at IS NULL');

    if (priorite) {
      query.andWhere('tache.priorite = :priorite', { priorite });
    }

    if (statut) {
      query.andWhere('tache.type = :statut', { statut });
    }

    return await query
      .orderBy('tache.priorite', 'DESC')
      .addOrderBy('tache.dateCreation', 'DESC')
      .getMany();
  }

  // Mettre à jour une tâche
  async update(id: string, updateTacheDto: UpdateTacheDto): Promise<tache> {
    const tacheExistante = await this.findOne(id);

    Object.assign(tacheExistante, updateTacheDto);

    try {
      return await this.tacheRepository.save(tacheExistante);
    } catch (error) {
      throw new BadRequestException('Erreur lors de la mise à jour de la tâche');
    }
  }

  // Dupliquer une tâche
  async duplicate(id: string): Promise<tache> {
    const tacheOriginale = await this.findOne(id);

    const tacheDupliquee = this.tacheRepository.create({
      titre: `${tacheOriginale.titre} (Copie)`,
      description: tacheOriginale.description,
      TimeEstimated: tacheOriginale.TimeEstimated,
      priorite: tacheOriginale.priorite,
      type: StatutTache.EN_ATTENTE, // Nouvelle tâche en attente
    });

    return await this.tacheRepository.save(tacheDupliquee);
  }

  // Suppression logique (soft delete)
  async remove(id: string): Promise<void> {
    const tacheExistante = await this.findOne(id);

    try {
      await this.tacheRepository.softDelete(id);
    } catch (error) {
      throw new BadRequestException('Erreur lors de la suppression de la tâche');
    }
  }

  // Restaurer une tâche supprimée
  async restore(id: string): Promise<tache> {
    // Vérifier si la tâche existe (même supprimée)
    const tacheSupprimee = await this.tacheRepository.findOne({
      where: { idTache: id },
      withDeleted: true
    });

    if (!tacheSupprimee) {
      throw new NotFoundException(`Tâche avec l'ID ${id} non trouvée`);
    }

    if (!tacheSupprimee.delete_at) {
      throw new BadRequestException('Cette tâche n\'est pas supprimée');
    }

    try {
      await this.tacheRepository.restore(id);
      return await this.findOne(id);
    } catch (error) {
      throw new BadRequestException('Erreur lors de la restauration de la tâche');
    }
  }

  // Lister les tâches supprimées
  async findDeleted(): Promise<tache[]> {
    return await this.tacheRepository.find({
      where: {},
      withDeleted: true
    }).then(taches => taches.filter(t => t.delete_at !== null));
  }

  // Exporter les tâches d'un utilisateur
  async exportTachesUtilisateur(employeId: string): Promise<Buffer> {
    const taches = await this.tacheRepository.find({
      where: {
        // employeId: employeId, // À adapter selon votre relation
        delete_at: IsNull()
      },
      order: { dateCreation: 'DESC' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tâches');

    // En-têtes
    worksheet.columns = [
      { header: 'ID', key: 'idTache', width: 40 },
      { header: 'Titre', key: 'titre', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Temps estimé', key: 'TimeEstimated', width: 15 },
      { header: 'Priorité', key: 'priorite', width: 15 },
      { header: 'Statut', key: 'type', width: 15 },
      { header: 'Date création', key: 'dateCreation', width: 20 },
      { header: 'Dernière mise à jour', key: 'update_at', width: 20 },
    ];

    // Données
    taches.forEach(tache => {
      worksheet.addRow({
        idTache: tache.idTache,
        titre: tache.titre,
        description: tache.description || '',
        TimeEstimated: tache.TimeEstimated || 0,
        priorite: tache.priorite,
        type: tache.type,
        dateCreation: tache.dateCreation.toLocaleDateString('fr-FR'),
        update_at: tache.update_at.toLocaleDateString('fr-FR'),
      });
    });

    // Style de l'en-tête
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    return await workbook.xlsx.writeBuffer() as Buffer;
  }
}