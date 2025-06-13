import { IsISO8601, IsOptional } from "class-validator";


export class CreateEntrepriseDto {
  @IsOptional()
  nom: string;

  @IsISO8601()
  @IsOptional()
  dateCreation: string; 
  // Format: YYYY-MM-DD
  @IsOptional()
  adresse: string;

  @IsOptional()
  domaine: string;
  
  @IsOptional()
  gestionnaireId?: string;
}
