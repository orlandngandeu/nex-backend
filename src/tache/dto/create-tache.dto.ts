import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { Priorite, StatutTache } from 'src/utils/enums/enums';

export class CreateTacheDto {
  @IsNotEmpty()
  @IsString()
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  TimeEstimated?: number;

  @IsOptional()
  @IsEnum(Priorite)
  priorite?: Priorite;

  @IsEnum(StatutTache)
  type: StatutTache;

}