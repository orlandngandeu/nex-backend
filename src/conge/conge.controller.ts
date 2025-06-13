import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CongeService } from './conge.service'
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/enums/role.enums';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { UpdateCongeDto } from './Dto/update-conge.dto';
import { CreateCongeDto } from './Dto/create-conge.dto';

@Controller('conges')
export class CongeController {
  constructor(private readonly congeService: CongeService) {}

  @Post(':id')
  @Roles(Role.Employe)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async CreateConge(
    @Param('id') idUtilisateur,
    @Body() createCongeDto: CreateCongeDto,
  ) {
    try {
      // 1. Validation de l'UUID
      /*if (!this.isValidUUID(idEmploye)) {
        throw new Error('UUID invalide');
      }*/
      // L'utilisateur est extrait du token JWT par le guard
      const createdConge = await this.congeService.createDemande(idUtilisateur, createCongeDto);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Demande de congé créée avec succès',
        data: createdConge
      };

     // return this.congeService.createDemande(idEmploye ,createCongeDto);
    } catch (error) {
      // 3. Gestion des erreurs
      /*if (error.message.includes('UUID invalide')) {
        throw new BadRequestException('Format ID employé incorrect');
      }
      if (error.message.includes('non trouvé')) {
        throw new NotFoundException('Employé inexistant');
      }
      if (error.message.includes('rôle')) {
        throw new ForbiddenException('Droits insuffisants');
      }
      throw error;*/

      // Gestion centralisée des erreurs
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la création de la demande',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
    }
  

  @Patch(':gestionnaireId/approuver/:congeId')
  @Roles(Role.Administrateur, Role.Gestionnaire)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async approve(
    @Param('gestionnaireId') gestionnaireId: string,
    @Param('congeId') congeId: number,
    @Body() updateCongeDto: UpdateCongeDto,
  ) {
    return this.congeService.traiterDemande(
      congeId,
      gestionnaireId,
      updateCongeDto,
    );
  }

  @Get('/attente')
  @Roles(Role.Administrateur, Role.Gestionnaire)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getDemandeEnAttente() {
    return this.congeService.getDemandesEnAttente();
  }

  @Get(':id')
  @Roles(Role.Gestionnaire, Role.Administrateur)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getdemandeEmploye(@Param('id') employeId){
    return this.congeService.getDemandesEmploye(employeId)
  }

  @Patch(':gestionnaireId/approuver/:congeId')
  @Roles(Role.Administrateur, Role.Gestionnaire, Role.Employe)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async approbationConge(
    @Param('gestionnaireId') gestionnaireId: string,
    @Param('congeId') congeId: number,
    @Body() updateCongeDto: UpdateCongeDto,
  ) {
    try {
      const congeMisAJour = await this.congeService.traiterDemande(
        congeId,
        gestionnaireId,
        updateCongeDto,
      );

      return {
        message: 'Demande de congé traitée avec succès',
        data: congeMisAJour,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException(
        "Une erreur est survenue lors du traitement de la demande",
      );
    }
  }

}
