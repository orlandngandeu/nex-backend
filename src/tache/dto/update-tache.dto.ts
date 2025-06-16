import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Priorite, StatutTache } from 'src/utils/enums/enums';

export class UpdateTacheDto {
  @IsOptional()
  @IsString()
  titre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  TimeEstimated?: number;

  @IsOptional()
  @IsEnum(Priorite)
  priorite?: Priorite;

  @IsOptional()
  @IsEnum(StatutTache)
  type?: StatutTache;
}