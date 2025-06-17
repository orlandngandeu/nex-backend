import { IsString, MinLength, Matches } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  ancienMotDePasse: string;

  @IsString()
  @MinLength(8, {message:'Le mot de passe doit contenir au moins 8 caractères'})
  @Matches(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
  @Matches(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Le mot de passe doit contenir au moins un caractère spécial' })
  nouveauMotDePasse: string;
}