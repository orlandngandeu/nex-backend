// src/entreprise/entreprise.service.ts
import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entreprise } from './entreprise.entity';
import { Utilisateur } from 'src/auth/auth.entity';
import { CreateEntrepriseDto } from './Dto/create-entreprise.dto';
import { UpdateEntrepriseDto } from './Dto/update-entreprise.dto';
import { Role } from 'src/enums/role.enums';

@Injectable()
export class EntrepriseService {
  constructor(
    @InjectRepository(Entreprise)
    private entrepriseRepository: Repository<Entreprise>,
    
    @InjectRepository(Utilisateur)
    private utilisateurRepository: Repository<Utilisateur>,
  ) {}

  async create(createEntrepriseDto: CreateEntrepriseDto, adminId: string): Promise<Entreprise> {
   try {
      // Vérifier que l'utilisateur est bien un admin
      const admin = await this.utilisateurRepository.findOne({
        where: { idUtilisateur: adminId, role: Role.Administrateur }
      });
      
      if (!admin) {
        throw new ForbiddenException('Seuls les administrateurs peuvent créer des entreprises');
      }
    
      const entreprise = await  this.entrepriseRepository.create({
        ...createEntrepriseDto,

      });
    
      // Si un gestionnaire est spécifié, vérifier son rôle
      if (createEntrepriseDto.gestionnaireId) {
        const gestionnaire = await this.utilisateurRepository.findOne({
          where: { idUtilisateur: createEntrepriseDto.gestionnaireId }
        });
        
        if (!gestionnaire) {
          throw new NotFoundException('Gestionnaire non trouvé');
        }
        
        // Assigner le rôle Gestionnaire
        gestionnaire.role = Role.Gestionnaire;
        await this.utilisateurRepository.save(gestionnaire);
        
        entreprise.gestionnaire = gestionnaire;
      }
      const saveEntreprise = await this.entrepriseRepository.save(entreprise);
      console.log(saveEntreprise)
    
      return saveEntreprise
   } catch (error) {
     throw new InternalServerErrorException(error)
   }
  }

  async findOne(id: number): Promise<Entreprise | null> {
    try {
        return this.entrepriseRepository.findOne({
            where: { idEtreprise: id },
            relations: ['gestionnaire', 'employe'],
          });
    } catch (error) {
        throw new InternalServerErrorException(error)
    }
  }

  async findAll(): Promise<Entreprise[]> {
    return this.entrepriseRepository.find({ relations: ['gestionnaire', 'employe'] });
  }

  async update(id: number, updateEntrepriseDto: UpdateEntrepriseDto): Promise<Entreprise | null> {
    try {
        await this.entrepriseRepository.update(id, updateEntrepriseDto);
        return this.entrepriseRepository.findOne({ where: { idEtreprise: id } });
    } catch (error) {
        throw new InternalServerErrorException(error)
    }
  }

  async remove(id: number): Promise<void> {
    try {
        await this.entrepriseRepository.delete(id);
    } catch (error) {
        throw new InternalServerErrorException(error)
    }
  }

  async ajouterEmploye(entrepriseId: number, employeId: string): Promise<Entreprise | null> {
    try {
        const entreprise = await this.entrepriseRepository.findOne({
            where: { idEtreprise: entrepriseId },});
        const employe = await this.utilisateurRepository.findOne({
            where: { idUtilisateur: employeId , role: Role.Employe},});
    
        if (!entreprise || !employe) {
          throw new Error('Entreprise ou employé non trouvé');
        }
    
        employe.entreprise = entreprise;
        await this.utilisateurRepository.save(employe);
    
        return this.entrepriseRepository.findOne({
          where: { idEtreprise: entrepriseId },
          relations: ['employe'],
        });
    } catch (error) {
        throw new InternalServerErrorException(error)
    }
  }
}