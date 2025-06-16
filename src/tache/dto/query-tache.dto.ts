import { IsOptional, IsString, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { Priorite, StatutTache } from 'src/utils/enums/enums';

export class QueryTacheDto {
  @IsOptional()
  @IsEnum(Priorite)
  priorite?: Priorite;

  @IsOptional()
  @IsEnum(StatutTache)
  statut?: StatutTache;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @IsOptional()
  @IsUUID()
  employeId?: string;
}