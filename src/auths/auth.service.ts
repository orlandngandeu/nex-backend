import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common"
import  { Repository } from "typeorm"
import  { Utilisateur } from "../auth/auth.entity"
import { Role } from "../enums/role.enums"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Utilisateur)
    private readonly utilisateurRepository: Repository<Utilisateur>,
  ) {}


  async createUserFromOAuth(oauthData: {
    email: string
    nom: string
    googleId: string
  }): Promise<Utilisateur> {
    try {
      // Vérifier si l'utilisateur existe déjà
      let utilisateur = await this.utilisateurRepository.findOne({
        where: { email: oauthData.email },
      })

      if (!utilisateur) {
        // Créer un nouvel utilisateur
        utilisateur = this.utilisateurRepository.create({
          email: oauthData.email,
          nom: oauthData.nom,
          role: Role.Administrateur,
          soldeConges: 0,
          salairePerheure: 0,
          motDePasse: undefined, // Pas de mot de passe pour OAuth
        })

        utilisateur = await this.utilisateurRepository.save(utilisateur)
        console.log("Nouvel utilisateur créé:", utilisateur.email)
      } else {
        console.log("Utilisateur existant connecté:", utilisateur.email)
      }

      return utilisateur
    } catch (error) {
      console.error("Erreur création utilisateur:", error)
      throw new BadRequestException("Erreur lors de la création de l'utilisateur")
    }
  }

  async findUserByEmail(email: string): Promise<Utilisateur | null> {
    return await this.utilisateurRepository.findOne({
      where: { email },
      relations: ["entreprise", "entreprisesGerees"],
    })
  }

  async findUserById(id: string): Promise<Utilisateur | null> {
    return await this.utilisateurRepository.findOne({
      where: { idUtilisateur: id },
      relations: ["entreprise", "entreprisesGerees"],
    })
  }

  async updateUser(id: string, updateData: Partial<Utilisateur>): Promise<Utilisateur> {
    const utilisateur = await this.findUserById(id)
    if (!utilisateur) {
      throw new NotFoundException("Utilisateur non trouvé")
    }

    Object.assign(utilisateur, updateData)
    return await this.utilisateurRepository.save(utilisateur)
  }
}
