import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import {StatutTache } from '../../enums/StatutTache';



export class UpdateTacheStatutDto {
  @ApiProperty({ description: 'Nouveau statut de la tâche', enum: ['En attente', 'En cours', 'Terminée'] })
   @IsNotEmpty()
  @IsEnum(StatutTache)
  type: StatutTache;
}