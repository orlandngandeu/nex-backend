import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Utilisateur } from 'src/auth/auth.entity';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/enums/role.enums';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Repository } from 'typeorm';

@Injectable()
export class GoogleAuthService {
    constructor(
        @InjectRepository(Utilisateur)
        private authRepository : Repository<Utilisateur>,
        private jwtService: JwtService,
    ){}

    @Roles(Role.Administrateur, Role.Gestionnaire)
    @UseGuards(AuthGuard(), RolesGuard)
    async findOrCreateGoogleUser(googleUser: any): Promise<Utilisateur> {
        const { idUtilisateur, nom, email, telephone} = googleUser;
    
        let utilisateur = await this.authRepository.findOne({ where: {idUtilisateur} });
    
        if (!utilisateur && email) {
          utilisateur = await this.authRepository.findOne({ where: { email } });
          if (utilisateur) {
            // Lier le compte Google à un compte existant
            utilisateur.idUtilisateur = idUtilisateur;
            utilisateur.nom = nom;
            await this.authRepository.save(utilisateur);
            return utilisateur;
          } else {
          // Créer un nouvel utilisateur
          utilisateur = this.authRepository.create({
            nom,
            email, 
            telephone,
            });
            await this.authRepository.save(utilisateur);
          }
        } else if (!utilisateur && !email) {
          // Gérer le cas où Google ne fournit pas d'email (rare)
          throw new Error('No email provided by Google.');
        } else if (utilisateur) {
          // Mettre à jour les informations si nécessaire
          await this.authRepository.save(utilisateur);
          return utilisateur
        }
    
        throw new NotFoundException(`Could not find or create user with Google ID: ${idUtilisateur}`);
      }
    
      async generateJwt(utilisateur: Utilisateur): Promise<{ token: string }> {
        const token = this.jwtService.sign({ id: utilisateur.idUtilisateur, roles: utilisateur.role});
        return { token };
      }
}
