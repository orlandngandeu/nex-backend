import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { StatutConge } from '../../conge/conge.entity';

export class RechercheEmployeDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  entrepriseId?: string;
}

export class FiltreCongeDto {
  @IsOptional()
  @IsEnum(StatutConge)
  statut?: StatutConge;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;
}

export class FiltreContratDto {
  @IsOptional()
  @IsString()
  statutContrat?: 'a_temps' | 'en_retard' | 'a_combler';

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;
}