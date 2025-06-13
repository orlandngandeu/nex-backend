import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Utilisateur } from "../auth/auth.entity";
import { GetAllEmployersDto } from "src/auth/Dto/getAllEmployes.dto";
import { Like, Repository } from "typeorm";
import { UpdateEmployesDto } from "../auth/Dto/update-employer.dto";
import { CreateEmployeDto } from "../auth/Dto/create-employe.dto";
import * as bcrypt from "bcryptjs";
import { Role } from "../enums/role.enums";
import { Entreprise } from "../entreprise/entreprise.entity";

@Injectable()
export class EmployesService {
  constructor(
    @InjectRepository(Utilisateur)
    private readonly utilisateurRepository: Repository<Utilisateur>,

    @InjectRepository(Entreprise)
    private readonly entrepriseRepository: Repository<Entreprise>
  ) {}
  // creer un employe dans la BD
  async create(employe: CreateEmployeDto): Promise<Utilisateur> {
    try { 
      const {nom, email, motDePasse, role } = employe;

      const existingUtilisateur = await this.utilisateurRepository.findOne({
        where: { email },
      });
      if (existingUtilisateur) {
        throw new ConflictException("Cet email est déjà utilisé.");
      }
      const hashPassword = await bcrypt.hash(motDePasse, 10);
      const newEmploye = await this.utilisateurRepository.create({
        nom,
        email,
        motDePasse: hashPassword,
        role
      });
      this.utilisateurRepository.save(newEmploye);
      return newEmploye;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
  /*async getAll(
    filters?: GetAllEmployersDto
  ): Promise<Utilisateur[] | undefined> {
    try {
      if (filters) {
        const { page = 1, limit = 10, ...whereFilters } = filters;
        const whereClause = {};

        // Construction dynamique du "where"
        if (filters.nom) {
          whereClause["nom"] = Like(`%${filters.nom}%`); // Recherche partielle
        }
        if (filters.telephone) {
          whereClause["telephone"] = Like(`%${filters.telephone}%`);
        }
        if (filters.soldeConges) {
          whereClause["departement"] = filters.soldeConges; // Recherche exacte
        }

        const utilisateurs = await this.utilisateurRepository.find({
          where: whereClause,
          skip: (page - 1) * limit,
          take: limit,
          order: { nom: "ASC", telephone: "DESC", soldeConges: "DESC" }, // Tri par nom
        });

        if (!utilisateurs) {
          throw new NotFoundException({ message: "Blogs not found" });
        }
        return utilisateurs;
      }
      const utilisateurs = await this.utilisateurRepository.find();
      return utilisateurs;
    } catch (error) {
      throw new NotFoundException(error);
    }
  }*/

    async getAll(filters?: GetAllEmployersDto): Promise<Utilisateur[] | undefined> {
  try {
    const queryBuilder = this.utilisateurRepository.createQueryBuilder('utilisateur')
      .leftJoinAndSelect('utilisateur.entreprise', 'entreprise');

    if (filters) {
      const { page = 1, limit = 10, ...whereFilters } = filters;

      // Filtre par nom
      if (filters.nom) {
        queryBuilder.andWhere('utilisateur.nom LIKE :nom', { nom: `%${filters.nom}%` });
      }

      // Filtre par téléphone
      if (filters.telephone) {
        queryBuilder.andWhere('utilisateur.telephone LIKE :telephone', { 
          telephone: `%${filters.telephone}%` 
        });
      }

      // Filtre par solde de congés
      if (filters.soldeConges) {
        queryBuilder.andWhere('utilisateur.soldeConges = :soldeConges', { 
          soldeConges: filters.soldeConges 
        });
      }

      // Filtre par entreprise (nouveau)
      if (filters.entrepriseId) {
        queryBuilder.andWhere('entreprise.idEntreprise = :entrepriseId', { 
          entrepriseId: filters.entrepriseId 
        });
      }

      // Pagination et tri
      queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .orderBy('utilisateur.nom', 'ASC')
        .addOrderBy('utilisateur.telephone', 'DESC')
        .addOrderBy('utilisateur.soldeConges', 'DESC');
    }

    const utilisateurs = await queryBuilder.getMany();

    if (!utilisateurs || utilisateurs.length === 0) {
      throw new NotFoundException('Aucun employé trouvé');
    }

    return utilisateurs;
  } catch (error) {
    throw new NotFoundException(error.message);
  }
}

  async findOne(id: string): Promise<Utilisateur | undefined> {
    try {
      // 1. Vérifier si l'employé existe
      const employes = await this.utilisateurRepository.findOne({
        where: { idUtilisateur: id },
      });

      if (!employes) {
        throw new NotFoundException(`Employé avec l'ID ${id} non trouvé`);
      }

      return employes;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(
    id: string,
    updateData: UpdateEmployesDto
  ): Promise<Utilisateur> {
    try {
      // 1. Vérifier si l'employé existe
      const employes = await this.utilisateurRepository.findOne({
        where: { idUtilisateur: id },
      }); 

       await bcrypt.hash(updateData.motDePasse, 10)

      if (!employes) {
        throw new NotFoundException(`Employé avec l'ID ${id} non trouvé`);
      }

      // 2. Fusionner les données existantes avec les nouvelles
      const updatedEmployer = this.utilisateurRepository.merge(
        employes,
        updateData,
        
      );

      try {
        // 3. Sauvegarder les modifications
        return await this.utilisateurRepository.save(updatedEmployer);
      } catch (error) {
        // 4. Gestion des erreurs spécifiques
        if (error.code === "23505") {
          throw new ConflictException(
            "Un employé avec ces données existe déjà"
          );
        }
        throw new InternalServerErrorException(
          "Échec de la mise à jour de l'employé"
        );
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

 /* async delete(id: string): Promise<{ message: string }> {
    try {
      // 1. Vérifier si l'employé existe
      const employes = await this.utilisateurRepository.findOne({
        where: { idUtilisateur: id },
      });

      if (!employes) {
        throw new NotFoundException(`Employé avec l'ID ${id} non trouvé`);
      }

      try {
        // 2. Tentative de suppression
        if(employes.role === Role.Employe){
          await this.utilisateurRepository.remove(employes);
        }

        if(employes.role === Role.Gestionnaire){
          await this.utilisateurRepository.remove(employes);
        }
        

        return {
          message: `Employé avec l'ID ${id} a été supprimé avec succès`,
        };
      } catch (error) {
        // 3. Gestion des erreurs
        if (error.code === "23503") {
          // Code d'erreur PostgreSQL pour violation de clé étrangère
          throw new ConflictException(
            `Impossible de supprimer l'employé car il est lié à d'autres données`
          );
        }

        throw new InternalServerErrorException(
          `Une erreur est survenue lors de la suppression de l'employé`
        );
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }*/

  async delete(id: string): Promise<{ message: string }> {
  try {
    // 1. Vérifier si l'utilisateur existe
    const user = await this.utilisateurRepository.findOne({
      where: { idUtilisateur: id},
      relations: ['entreprise'] // Charge la relation entreprise
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // 2. Si c'est un administrateur, supprimer toute l'entreprise
    if (user.role === Role.Administrateur && user.entreprise) {
      // Trouver l'entreprise associée
      const entreprise = user.entreprise;
      
      // Supprimer l'entreprise (cela supprimera automatiquement les employés et invitations)
      await this.entrepriseRepository.remove(entreprise);
      
      return {
        message: `Administrateur et toute l'entreprise associée ont été supprimés avec succès`,
      };
    }
    // 3. Si c'est un employé ou gestionnaire, suppression normale
    else {
      await this.utilisateurRepository.remove(user);
      return {
        message: `Utilisateur avec l'ID ${id} a été supprimé avec succès`,
      };
    }
  } catch (error) {
    // Gestion des erreurs
    if (error instanceof NotFoundException) {
      throw error;
    }
    if (error.code === "23503") {
      throw new ConflictException(
        `Impossible de supprimer l'utilisateur car il est lié à d'autres données`
      );
    }
    throw new InternalServerErrorException(
      `Une erreur est survenue lors de la suppression: ${error.message}`
    );
  }
 }
 async getUtilisateurConnecte(userId: string): Promise<Partial<Utilisateur>> {
  try {
    const utilisateur = await this.utilisateurRepository.findOne({
      where: { idUtilisateur: userId },
    });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // Retourner les informations sans le mot de passe et les tokens sensibles
    const { motDePasse, tokenReinitialisation, expirationTokenReinitialisation, codeInvitation, ...utilisateurSansMotDePasse } = utilisateur;

    return utilisateurSansMotDePasse;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    throw new Error('Erreur lors de la récupération de l\'utilisateur.');
  }
}
}
