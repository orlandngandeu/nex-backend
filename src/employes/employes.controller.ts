import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { EmployesService } from './employes.service';
import { GetAllEmployersDto } from 'src/auth/Dto/getAllEmployes.dto';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/enums/role.enums';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { UpdateEmployesDto } from 'src/auth/Dto/update-employer.dto';
import { Response } from 'express';
import { CreateEmployeDto } from 'src/auth/Dto/create-employe.dto';
import { Utilisateur } from 'src/auth/auth.entity';
import { Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Employes')
@Controller('employes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EmployesController {
    constructor(
        private readonly employesService : EmployesService
    ){}

    @Get()
    @ApiOperation({ summary: 'Récupérer tous les employés (avec filtres)' })
    @ApiResponse({ status: 200, description: 'Liste des employés récupérée avec succès.' })
    @ApiResponse({ status: 404, description: 'Aucun employé trouvé.' })
    @ApiQuery({ name: 'filters', required: false, type: GetAllEmployersDto, description: 'Filtres pour la récupération des employés' })
    @Roles(Role.Administrateur, Role.Gestionnaire)
    async getAllEmployers( @Res() res: Response, @Query() filters?: GetAllEmployersDto){
        try {

            if(filters){
                const utilisateurs = await this.employesService.getAll(filters)
                return res.status(200).json({success: true, data: utilisateurs})
            }
            
            const utilisateurs = await this.employesService.getAll()
            return res.status(HttpStatus.OK).json({success: true, data: utilisateurs})
        } catch (error) {
            return res.status(HttpStatus.BAD_REQUEST).json({success: false, message: "Not found employees" })
        }
    }

    @Roles(Role.Administrateur, Role.Gestionnaire)
    @Post()
    @ApiOperation({ summary: 'Créer un nouvel employé' })
    @ApiResponse({ status: 201, description: 'Employé créé avec succès.' })
    @ApiBody({ type: CreateEmployeDto, description: 'Détails de l\'employé à créer' })
    @HttpCode(HttpStatus.CREATED)
    async create(@Res() res: Response, @Body() createEmployeDto: CreateEmployeDto){
        try {
            const user = await this.employesService.create(createEmployeDto);
            return res.status(HttpStatus.OK).json({success: true, data: user})
        } catch (error) {
            throw new NotFoundException(error)
        }
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Administrateur, Role.Gestionnaire, Role.Employe)
    async updateEmployer(
      @Param('id') id: string,
      @Body() updateEmployerDto: UpdateEmployesDto,
    ) {
      return this.employesService.update(id, updateEmployerDto);
    }



    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Administrateur, Role.Gestionnaire)
    async delete(
        @Param('id') id: string
    ) {
        try {
            const employeDel =await this.employesService.delete(id);
            return employeDel;
        } catch (error) {
            throw new NotFoundException("erreur a la suppression de l'employe: ",error.message)
        }
    }
    @Get('me')
    async getUtilisateurConnecte(@Request() req): Promise<Partial<Utilisateur>> {
      const userId = await req.user.id;
      return await this.employesService.getUtilisateurConnecte(userId);
    }
    
}
