// src/entreprise/entreprise.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    UseGuards,
    Req,
    UnauthorizedException,
    InternalServerErrorException,
  } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { EntrepriseService } from './entreprise.service';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/enums/role.enums';
import { CreateEntrepriseDto } from './Dto/create-entreprise.dto';
import { UpdateEntrepriseDto } from './Dto/update-entreprise.dto';
import { Entreprise } from './entreprise.entity';
  ;
  
  @Controller('entreprises')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  export class EntrepriseController {
    constructor(private readonly entrepriseService: EntrepriseService,
    ) {}
  
    @Post(':id')
    @Roles(Role.Administrateur)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    async create(
    @Body() createEntrepriseDto: CreateEntrepriseDto,
    @Param("id") idadmin: string,
    ) : Promise<Entreprise>{
      try {
      
      if (!idadmin) {
          throw new UnauthorizedException();
      }
      const entreprise = this.entrepriseService.create(createEntrepriseDto, idadmin);
      return entreprise;
      } catch (error) {
        throw new InternalServerErrorException(error)
      }
    }

  
    @Get()
    @Roles(Role.Administrateur, Role.Gestionnaire)
    findAll() {
      return this.entrepriseService.findAll();
    }
  
    @Get(':id')
    @Roles(Role.Administrateur, Role.Gestionnaire)
    findOne(@Param('id') id: string) {
      return this.entrepriseService.findOne(+id);
    }
  
    @Put(':id')
    @Roles(Role.Administrateur, Role.Gestionnaire)
    update(@Param('id') id: string, @Body() updateEntrepriseDto: UpdateEntrepriseDto) {
      return this.entrepriseService.update(+id, updateEntrepriseDto);
    }
  
    @Delete(':id')
    @Roles(Role.Administrateur)
    remove(@Param('id') id: string) {
      return this.entrepriseService.remove(+id);
    }
  
    @Post(':id/employes/:employeId')
    @Roles(Role.Gestionnaire, Role.Administrateur) // Seuls les gestionnaires peuvent ajouter
    async ajouterEmploye(
    @Param('id') entrepriseId: string,
    @Param('employeId') employeId: string,
    ) {
    if (!employeId) {
        throw new UnauthorizedException();
    }
    return this.entrepriseService.ajouterEmploye(
        +entrepriseId,
        employeId,     
    );
    }


}