import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpStatus, HttpException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { TacheService } from './tache.service';
import { CreateTacheDto } from './dto/create-tache.dto';
import { UpdateTacheDto } from './dto/update-tache.dto';
import { UpdateTacheStatutDto } from './dto/update-tache-statut.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/enums/role.enums';


@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Administrateur, Role.Gestionnaire)
@ApiTags('taches')
@Controller('taches')
@ApiBearerAuth()
export class TacheController {
  constructor(private readonly tacheService: TacheService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle tâche' })
  @ApiResponse({ status: 201, description: 'Tâche créée avec succès' })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  async create(@Body() createTacheDto: CreateTacheDto) {
    try {
      const tache = await this.tacheService.create(createTacheDto);
      return { success: true, data: tache };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les tâches avec filtres optionnels' })
  @ApiQuery({ name: 'titre', required: false, description: 'Filtrer par titre' })
  @ApiQuery({ name: 'statut', required: false, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'priorite', required: false, description: 'Filtrer par priorité' })
  @ApiResponse({ status: 200, description: 'Liste des tâches récupérée avec succès' })
  async findAll(
    @Query('titre') titre?: string,
    @Query('statut') statut?: string,
    @Query('priorite') priorite?: string,
  ) {
    try {
      const filters = { titre, statut, priorite };
      const taches = await this.tacheService.findAll(filters);
      return { success: true, data: taches };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une tâche par ID' })
  @ApiResponse({ status: 200, description: 'Tâche récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Tâche non trouvée' })
  async findOne(@Param('id') id: string) {
    try {
      const tache = await this.tacheService.findOne(id);
      if (!tache) {
        throw new NotFoundException('Tâche non trouvée');
      }
      return { success: true, data: tache };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.NOT_FOUND
        );
      }
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('employe/:employeId')
  @ApiOperation({ summary: 'Récupérer les tâches d\'un employé' })
  @ApiResponse({ status: 200, description: 'Tâches récupérées avec succès' })
  async findByEmploye(@Param('employeId') employeId: string) {
    try {
      const taches = await this.tacheService.findByEmploye(employeId);
      return { success: true, data: taches };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  @ApiResponse({ status: 200, description: 'Tâche mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Tâche non trouvée' })
  async update(@Param('id') id: string, @Body() updateTacheDto: UpdateTacheDto) {
    try {
      const tache = await this.tacheService.update(id, updateTacheDto);
      return { success: true, data: tache };
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.NOT_FOUND
        );
      }
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Patch(':id/statut')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une tâche' })
  @ApiResponse({ status: 200, description: 'Statut de la tâche mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Tâche non trouvée' })
  async updateStatut(
    @Param('id') id: string, 
    @Body() updateTacheStatutDto: UpdateTacheStatutDto
  ) {
    try {
      const tache = await this.tacheService.updateStatut(id, updateTacheStatutDto);
      return { success: true, data: tache };
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.NOT_FOUND
        );
      }
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une tâche' })
  @ApiResponse({ status: 200, description: 'Tâche supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Tâche non trouvée' })
  async remove(@Param('id') id: string) {
    try {
      await this.tacheService.remove(id);
      return { 
        success: true, 
        message: 'Tâche supprimée avec succès' 
      };
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.NOT_FOUND
        );
      }
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}