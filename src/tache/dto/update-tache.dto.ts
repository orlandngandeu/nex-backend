import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString, IsNotEmpty, IsNumber, Min,IsEnum } from 'class-validator';
import { StatutTache } from '../../enums/StatutTache';

export class UpdateTacheDto {
  @ApiProperty({ description: 'Titre de la tâche', required: false })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiProperty({ description: 'Description de la tâche', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID de l\'employé assigné à la tâche', required: false })
  @IsOptional()
  @IsUUID()
  employeAssigneId?: string;

  @ApiProperty({ description: 'Date d\'échéance de la tâche', required: false })
  @IsOptional()
  @IsDateString()
  dateEcheance?: Date;

  @ApiProperty({ description: 'Priorité de la tâche', required: false })
  @IsOptional()
  @IsString()
  priorite?: string;

 
   @ApiProperty({ description: 'Nouveau statut de la tâche', enum: ['En attente', 'En cours', 'Terminée'] })
    @IsNotEmpty()
   @IsEnum(StatutTache)
   type: StatutTache;

  @ApiProperty({ description: 'Durée prévue en heures', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  dureeEnHeures?: number;
}