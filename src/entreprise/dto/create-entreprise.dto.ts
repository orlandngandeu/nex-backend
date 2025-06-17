import { IsString, IsEmail, IsNumber, IsUUID, IsNotEmpty, Min } from 'class-validator';

export class CreateEntrepriseDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  domaine: string;

  @IsString()
  @IsNotEmpty()
  adresse: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @Min(1)
  nbre_employers: number;
}