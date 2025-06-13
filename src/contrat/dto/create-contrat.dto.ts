import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional,IsDate,Min,Max,IsBoolean,IsIn, IsString ,ArrayMinSize, ArrayMaxSize, Validate} from 'class-validator';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';


export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  utilisateurId: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Type(() => Number)
  @IsNumber({}, { each: true })
  lieu: number[];

  @IsDateString()
  @IsNotEmpty()
  horaireDebut: string;

  @IsDateString()
  @IsNotEmpty()
  horaireFin: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  poste: string;

  @IsString()
  @IsOptional()
  pause?: string;

  @IsArray()
  @IsOptional()
  tachesIds?: number[];

  @IsArray()
  @IsOptional()
  equipementsIds?: number[];

  @IsOptional()
  @IsBoolean()
  estRepetitif?: boolean;
  
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4500)
  nombreJoursRepetition?: number;


}


export class UpdateContractDto {
  @IsString()
  @IsOptional()
  utilisateurId?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @IsOptional()
  lieu?: number[];

  @IsDateString()
  @IsOptional()
  horaireDebut?: string;

  @IsDateString()
  @IsOptional()
  horaireFin?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  poste?: string;

  @IsString()
  @IsOptional()
  pause?: string;

  @IsArray()
  @IsOptional()
  tachesIds?: number[];

  @IsArray()
  @IsOptional()
  equipementsIds?: number[];
}

export class AddTaskToContractDto {
  @IsString()
  @IsNotEmpty()
  tacheId: string;
}

export class AddResourceToContractDto {
  @IsString()
  @IsNotEmpty()
  ressourceId: string;
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  emetteurId: string;

  @IsString()
  @IsNotEmpty()
  destinataireId: string;

  @IsString()
  @IsNotEmpty()
  contenu: string;

  @IsString()
  @IsOptional()
  fichierJoint?: string;
}

export class PointageContratDto {
  @IsString()
  @IsNotEmpty()
  utilisateurId: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsOptional()
  localisation?: number[]; // [latitude, longitude]

  @IsDateString()
  @IsOptional()
  heureDepart?: string;
}
export class SaveAsTemplateDto {
  @IsString()
  @IsNotEmpty()
  nomGabarit: string;
}

export class CreateFromTemplateDto {
  @IsString()
  @IsNotEmpty()
  gabaritId: string;

  @IsString()
  @IsNotEmpty()
  utilisateurId: string;
}
export class CalculHeuresMensuellesDto {
  idEmploye: string;
  mois: number;
  annee: number;
}
export class CheckScheduleConflictDto {
  @IsString()
  @IsNotEmpty()
  utilisateurId: string;

  @IsDateString()
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value).toISOString())
  horaireDebut: string;

  @IsDateString()
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value).toISOString())
  horaireFin: string;

  @IsOptional()
  @IsString()
  excludeContractId?: string;
}