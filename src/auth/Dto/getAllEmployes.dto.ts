import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetAllEmployersDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  soldeConges?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

@IsOptional()
@IsNumber()
limit?: number;

  @IsOptional()
  @IsNumber()
  entrepriseId?: number;

  // Ajoutez d'autres propriétés au besoin
}
