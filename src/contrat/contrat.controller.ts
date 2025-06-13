import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, UseInterceptors, UploadedFile, Query, UseGuards } from '@nestjs/common';
import { ContractService } from './contrat.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { extname } from 'path';
import {
  CreateContractDto,
  UpdateContractDto,
  AddTaskToContractDto,
  AddResourceToContractDto,
  CreateCommentDto,
  PointageContratDto,
  SaveAsTemplateDto,
  CreateFromTemplateDto,
} from './dto/create-contrat.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/enums/role.enums';
import { NotFoundException } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';






@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Contrats')
@Controller('contrats')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

   /**
   * Extrait le fuseau horaire depuis les headers de la requête
   */
   private getTimezoneFromHeaders(headers: any): string {
    // Chercher le fuseau horaire dans les headers
    const timezone = headers['x-timezone'] || headers['timezone'];
    
    // Validation basique du fuseau horaire
    if (timezone && this.isValidTimezone(timezone)) {
      return timezone;
    }
    
    // Fuseau horaire par défaut
    return 'Africa/Douala';
  }
    private isValidTimezone(timezone: string): boolean {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return true;
      } catch (error) {
        return false;
      }
    }
  
  
  @Get('heures-mensuelles/rapport')
  @ApiOperation({ summary: 'Obtenir le rapport des heures mensuelles' })
  @ApiQuery({ name: 'moisDebut', required: false, type: Number, description: 'Mois de début (1-12)' })
  @ApiQuery({ name: 'anneeDebut', required: false, type: Number, description: 'Année de début' })
  @ApiQuery({ name: 'moisFin', required: false, type: Number, description: 'Mois de fin (1-12)' })
  @ApiQuery({ name: 'anneeFin', required: false, type: Number, description: 'Année de fin' })
  @ApiQuery({ name: 'idEmploye', required: false, type: String, description: 'ID de l\'employé (optionnel)' })
  @ApiResponse({ status: 200, description: 'Rapport des heures mensuelles généré avec succès' })
  @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })

  @Roles(Role.Administrateur, Role.Gestionnaire)
  async obtenirRapportHeuresMensuelles(
    @Query('moisDebut') moisDebut: number,
    @Query('anneeDebut') anneeDebut: number,
    @Query('moisFin') moisFin: number,
    @Query('anneeFin') anneeFin: number,
    @Res() res: Response,
    @Query('idEmploye') idEmploye?: string,
  ) {
    try {
      // Obtenir la date actuelle si aucune date n'est spécifiée
      const dateActuelle = new Date();
      const moisActuel = dateActuelle.getMonth() + 1; // getMonth() retourne 0-11
      const anneeActuelle = dateActuelle.getFullYear();
  
      // Utiliser les dates fournies ou la date actuelle par défaut
      const debut = {
        mois: moisDebut ? parseInt(moisDebut.toString(), 10) : moisActuel,
        annee: anneeDebut ? parseInt(anneeDebut.toString(), 10) : anneeActuelle,
      };
      const fin = {
        mois: moisFin ? parseInt(moisFin.toString(), 10) : moisActuel,
        annee: anneeFin ? parseInt(anneeFin.toString(), 10) : anneeActuelle,
      };
  
      // Initialiser le tableau rapport
      const rapport: { mois: number; annee: number; donnees: any[] }[] = [];
      let currentDate = new Date(debut.annee, debut.mois - 1, 1);
      const endDate = new Date(fin.annee, fin.mois - 1, 1);
  
      while (currentDate <= endDate) {
        const currentMois = currentDate.getMonth() + 1;
        const currentAnnee = currentDate.getFullYear();
  
        const donneesMois = await this.contractService.obtenirHeuresMensuelles(
          idEmploye,
          currentMois,
          currentAnnee
        );
  
        rapport.push({
          mois: currentMois,
          annee: currentAnnee,
          donnees: donneesMois,
        });
  
        // Passer au mois suivant
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
  
      return res.json({ success: true, data: rapport });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get()
  @Roles(Role.Administrateur, Role.Gestionnaire)
  @ApiOperation({ summary: 'Récupérer tous les contrats' })
  @ApiResponse({ status: 200, description: 'Contrats récupérés avec succès' })
  @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
  async findAll(@Res() res: Response) {
    try {
      const contracts = await this.contractService.findAll();
      return res.json({ success: true, data: contracts });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Récupérer les contrats d\'un employé' })
  @ApiResponse({ status: 200, description: 'Contrats récupérés avec succès' })
  @ApiResponse({ status: 404, description: 'Employé non trouvé' })
  @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
  @Roles(Role.Administrateur, Role.Gestionnaire)
  async findByEmployee(@Param('employeeId') employeeId: string, @Res() res: Response) {
    try {
      const contracts = await this.contractService.findContractsByEmployeeId(employeeId);
      return res.json({ success: true, data: contracts });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('heures-mensuelles/calculer-toutes')
  @ApiOperation({ summary: 'Calculer et enregistrer les heures mensuelles de tous les employés' })
  @ApiResponse({ status: 200, description: 'Heures mensuelles calculées avec succès' })
  @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
@Roles(Role.Administrateur)
async calculerToutesHeuresMensuelles(
  @Body() data: { mois: number; annee: number },
  @Res() res: Response
) {
  try {
    await this.contractService.recalculerToutesHeuresMensuelles(data.mois, data.annee);
    return res.json({
      success: true,
      message: `Heures mensuelles calculées pour tous les employés pour ${data.mois}/${data.annee}`,
    });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
}

 

@Post()
@Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Créer un nouveau contrat' })
@ApiResponse({ status: 201, description: 'Contrat créé avec succès' })
@ApiResponse({ status: 400, description: 'Requête invalide' })
@ApiResponse({ status: 404, description: 'Ressource non trouvée' })
async create(
  @Body() createContractDto: CreateContractDto, 
  @Headers() headers: any,
  @Res() res: Response
) {
  try {
    const timezone = this.getTimezoneFromHeaders(headers);
    const contract = await this.contractService.create(createContractDto, timezone);
    
    // Formater le contrat pour l'affichage avec le fuseau horaire local
    const formattedContract = this.contractService.formatContractForDisplay(contract[0], timezone);
    
    return res.status(HttpStatus.CREATED).json({
      success: true,
      contract: formattedContract,
      timezone,
    });
  } catch (error) {
    if (error instanceof NotFoundException) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    
    if (error instanceof ConflictException) {
      return res.status(HttpStatus.CONFLICT).json({
        success: false,
        message: error.message,
        error: 'SCHEDULE_CONFLICT',
      });
    }
    
    console.error('Error creating contract:', error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Erreur lors de la création du contrat',
      error: error.message,
    });
  }
}

  @Patch(':id')
  @Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Mettre à jour un contrat existant' })
@ApiResponse({ status: 200, description: 'Contrat mis à jour avec succès' })
@ApiResponse({ status: 404, description: 'Contrat non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
    @Headers() headers: any,
    @Res() res: Response,
  ) {
    try {
      const timezone = this.getTimezoneFromHeaders(headers);
      const contract = await this.contractService.update(id, updateContractDto, timezone);
      
      // Formater le contrat pour l'affichage avec le fuseau horaire local
      const formattedContract = this.contractService.formatContractForDisplay(contract, timezone);
      
      return res.json({
        success: true,
        contract: formattedContract,
        timezone,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      
      if (error instanceof ConflictException) {
        return res.status(HttpStatus.CONFLICT).json({
          success: false,
          message: error.message,
          error: 'SCHEDULE_CONFLICT',
        });
      }
      
      console.error('Error updating contract:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Erreur lors de la mise à jour du contrat',
        error: error.message,
      });
    }
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un contrat' })
  @ApiResponse({ status: 200, description: 'Contrat supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Contrat non trouvé' })
  @Roles(Role.Administrateur, Role.Gestionnaire)
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.contractService.remove(id);
      return res.json({
        success: true,
        message: 'Contrat supprimé avec succès',
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      
      console.error('Error deleting contract:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Erreur lors de la suppression du contrat',
        error: error.message,
      });
    }
  }
  

  @Post(':id/tache')
  @ApiOperation({ summary: 'Ajouter une tâche à un contrat' })
  @ApiResponse({ status: 200, description: 'Tâche ajoutée au contrat avec succès' })
  @ApiResponse({ status: 404, description: 'Contrat non trouvé' })
  @ApiResponse({ status: 400, description: 'Requête invalide' })

  @Roles(Role.Administrateur, Role.Gestionnaire)
  async addTask(
    @Param('id') id: string,
    @Body() addTaskDto: AddTaskToContractDto,
    @Res() res: Response,
  ) {
    try {
      const contract = await this.contractService.addTaskToContract(id, addTaskDto);
      return res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      if (error.name === 'NotFoundException') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }



  @Post(':id/commentaire')
  @Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Ajouter un commentaire à un contrat' })
@ApiResponse({ status: 200, description: 'Commentaire ajouté au contrat avec succès' })
@ApiResponse({ status: 404, description: 'Contrat non trouvé' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/commentaire',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async addComment(
    @Param('id') id: string,
    @Body() commentDto: CreateCommentDto,
    @UploadedFile() file,
    @Res() res: Response,
  ) {
    try {
      // Si un fichier est téléchargé, mettre à jour le DTO avec le chemin du fichier
      if (file) {
        commentDto.fichierJoint = file.path;
      }

  const commentaire = await this.contractService.addCommentToContract(id, commentDto);
  return res.json({
    success: true,
     commentaire,
  });
} catch (error) {
      if (error.name === 'NotFoundException') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post(':id/pointage')
  @Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Pointage de présence pour un contrat' })
  @ApiResponse({ status: 200, description: 'Pointage de présence effectué avec succès' })
  @ApiResponse({ status: 404, description: 'Contrat non trouvé' })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  async pointagePresence(
    @Param('id') id: string,
    @Body() pointageDto: PointageContratDto,
    @Res() res: Response,
  ) {
    try {
      const presence = await this.contractService.pointagePresence(id, pointageDto);
      return res.json({
        success: true,
         presence,
      });
    } catch (error) {
      if (error.name === 'NotFoundException') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get(':id/presences')
  @Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Récupérer les présences d\'un contrat' })
  @ApiResponse({ status: 200, description: 'Présences récupérées avec succès' })
  @ApiResponse({ status: 404, description: 'Contrat non trouvé' })
  async getContractPresences(@Param('id') id: string, @Res() res: Response) {
    try {
      const presences = await this.contractService.getContractPresences(id);
      return res.json({
        success: true,
         presences,
      });
    } catch (error) {
      if (error.name === 'NotFoundException') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

@Get('presences/all')
@Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Récupérer toutes les présences' })
@ApiResponse({ status: 200, description: 'Présences récupérées avec succès' })
@ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
async findAllPresences(@Res() res: Response) {
  try {
    const presences = await this.contractService.findAllPresences();
    return res.json({
      success: true,
      data: presences,
    });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
}
// Route pour calculer et enregistrer les heures mensuelles de tous les employés


@Get('presences/employee/:employeeId')
@Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Récupérer les présences d\'un employé' })
@ApiResponse({ status: 200, description: 'Présences récupérées avec succès' })
@ApiResponse({ status: 404, description: 'Employé non trouvé' })
async findPresencesByEmployee(@Param('employeeId') employeeId: string, @Res() res: Response) {
  try {
    const presences = await this.contractService.findPresencesByEmployeeId(employeeId);
    return res.json({
      success: true,
      data: presences,
    });
  } catch (error) {
    if (error.name === 'NotFoundException') {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
}

@Post(':id/save-as-template')
@Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Sauvegarder un contrat comme gabarit' })
@ApiResponse({ status: 200, description: 'Contrat sauvegardé comme gabarit avec succès' })
@ApiResponse({ status: 404, description: 'Contrat non trouvé' })
async saveAsTemplate(
  @Param('id') id: string,
  @Body() saveDto: SaveAsTemplateDto,
  @Res() res: Response,
) {
  try {
    const template = await this.contractService.saveAsTemplate(id, saveDto);
    return res.json({
      success: true,
      data: template,
      message: 'Contrat sauvegardé comme gabarit avec succès',
    });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
}

// Méthode pour récupérer tous les gabarits
@Get('get-all-templates') 
@Roles(Role.Administrateur, Role.Gestionnaire) 
@ApiOperation({ summary: 'Récupérer tous les gabarits de contrat' })
@ApiResponse({ status: 200, description: 'Gabarits récupérés avec succès' })
@ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
async getAllTemplates(@Res() res: Response) {
  try {
    const templates = await this.contractService.getAllTemplates();
    return res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
}

// Méthode pour récupérer les gabarits par poste
@Get('templates/by-poste/:poste')
@Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Récupérer les gabarits de contrat par poste' })
@ApiResponse({ status: 200, description: 'Gabarits récupérés avec succès' })
@ApiResponse({ status: 404, description: 'Poste non trouvé' })
async getTemplatesByPoste(@Param('poste') poste: string, @Res() res: Response) {
  try {
    const templates = await this.contractService.getTemplatesByPoste(poste);
    return res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
}

@Get('heures-travail')
@Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Obtenir les heures de travail des employés' })
@ApiResponse({ status: 200, description: 'Heures de travail récupérées avec succès' })
@ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
async obtenirHeuresTravail(@Res() res: Response, @Query('idEmploye') idEmploye?: string) {
  try {
    const heuresTravail = await this.contractService.obtenirHeuresTravailEmployes(idEmploye);
    return res.json({ success: true, data: heuresTravail });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
}


@Get('heures-travail/:idEmploye')
@Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Obtenir les heures de travail d\'un employé spécifique' })
@ApiResponse({ status: 200, description: 'Heures de travail récupérées avec succès' })
@ApiResponse({ status: 404, description: 'Employé non trouvé' })
async obtenirHeuresTravailEmploye(@Param('idEmploye') idEmploye: string, @Res() res: Response) {
  try {
    const heuresTravail = await this.contractService.obtenirHeuresTravailEmployes(idEmploye);
    return res.json({ success: true, data: heuresTravail });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
}


// Méthode pour créer un nouveau contrat à partir d'un gabarit
@Post('create-from-template')
@Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Créer un contrat à partir d\'un gabarit' })
@ApiResponse({ status: 201, description: 'Contrat créé à partir du gabarit avec succès' })
@ApiResponse({ status: 400, description: 'Requête invalide' })
async createFromTemplate(@Body() createDto: CreateFromTemplateDto, @Res() res: Response) {
  try {
    const contract = await this.contractService.createFromTemplate(createDto);
    return res.json({
      success: true,
      data: contract,
      message: 'Contrat créé à partir du gabarit avec succès',
    });
  } catch (error) {
    // Gestion spécifique pour les erreurs de validation
    if (error.name === 'BadRequestException') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
}

@Get('heures-mensuelles/:idEmploye')
  @Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Obtenir les heures mensuelles d\'un employé' })
@ApiResponse({ status: 200, description: 'Heures mensuelles récupérées avec succès' })
@ApiResponse({ status: 404, description: 'Employé non trouvé' })
  async obtenirHeuresMensuellesEmploye(
    @Res() res: Response,
    @Param('idEmploye') idEmploye: string,
    @Query('mois') mois?: number,
    @Query('annee') annee?: number,
    
  ) {
    try {
      const heuresMensuelles = await this.contractService.obtenirHeuresMensuelles(
        idEmploye,
        mois ? parseInt(mois.toString(), 10) : undefined,
        annee ? parseInt(annee.toString(), 10) : undefined
      );
      return res.json({ success: true, data: heuresMensuelles });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
  
  // Route pour obtenir les heures mensuelles de tous les employés
  @Get('heures-mensuelles')
  @ApiOperation({ summary: 'Obtenir les heures mensuelles globales' })
  @ApiResponse({ status: 200, description: 'Heures mensuelles récupérées avec succès' })
  @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
  @Roles(Role.Administrateur, Role.Gestionnaire)
  async obtenirHeuresMensuellesGlobales(
    @Res() res: Response,
    @Query('mois') mois?: number,
    @Query('annee') annee?: number,
  
  ) {
    try {
      const heuresMensuelles = await this.contractService.obtenirHeuresMensuelles(
        undefined,
        mois ? parseInt(mois.toString(), 10) : undefined,
        annee ? parseInt(annee.toString(), 10) : undefined
      );
      return res.json({ success: true, data: heuresMensuelles });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Route pour calculer et enregistrer les heures mensuelles d'un employé
  @Post('heures-mensuelles/calculer/:idEmploye')
  @Roles(Role.Administrateur, Role.Gestionnaire)
@ApiOperation({ summary: 'Calculer et enregistrer les heures mensuelles d\'un employé' })
@ApiResponse({ status: 200, description: 'Heures mensuelles calculées et enregistrées avec succès' })
@ApiResponse({ status: 404, description: 'Employé non trouvé' })
  async calculerHeuresMensuellesEmploye(
    @Param('idEmploye') idEmploye: string,
    @Body() data: { mois: number; annee: number },
    @Res() res: Response
  ) {
    try {
      const resultat = await this.contractService.calculerEtStockerHeuresMensuelles(
        idEmploye,
        data.mois,
        data.annee
      );
      return res.json({ success: true, data: resultat });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Route pour récupérer le rapport d'heures mensuelles sur une période

 
  @Get(':id')
@Roles(Role.Administrateur, Role.Gestionnaire)

async findOne(@Param('id') id: string, @Res() res: Response) {
  try {
    const contract = await this.contractService.findOne(id);
    return res.json({ success: true, data: contract });
  } catch (error) {
    if (error.name === 'NotFoundException') {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
}

@Get('entreprise/:idEntreprise')
@Roles(Role.Administrateur, Role.Gestionnaire)
async getContractsByCompany(@Param('idEntreprise') idEntreprise: number, @Res() res: Response) {
  try {
    const contracts = await this.contractService.findContractsByCompanyId(idEntreprise);
    return res.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
}

}