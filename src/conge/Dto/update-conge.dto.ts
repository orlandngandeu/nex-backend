import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatutConge } from '../conge.entity';


export class UpdateCongeDto {
  @IsOptional()
  @IsEnum(StatutConge)
  statut?: StatutConge;

  @IsOptional()
  @IsString()
  motifRefus?: string;
}