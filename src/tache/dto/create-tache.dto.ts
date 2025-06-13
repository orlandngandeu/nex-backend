import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateTacheDto {
  @ApiProperty({ description: 'Titre de la tâche' })
  @IsNotEmpty()
  @IsString()
  titre: string;

  @ApiProperty({ description: 'Description de la tâche', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID de l\'employé assigné à la tâche' })
  @IsNotEmpty()
  @IsUUID()
  employeAssigneId: string;

  @ApiProperty({ description: 'Date d\'échéance de la tâche', required: false })
  @IsOptional()
  @IsDateString()
  dateEcheance?: Date;

  @ApiProperty({ description: 'Priorité de la tâche', required: false })
  @IsOptional()
  @IsString()
  priorite?: string;

  @ApiProperty({ description: 'Durée prévue en heures', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  dureeEnHeures?: number;
}