import { IsString, IsPhoneNumber, MinLength, IsEmail, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Nom complet de l\'utilisateur' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ description: 'Adresse email de l\'utilisateur' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Numéro de téléphone' })
  @IsPhoneNumber()
  telephone: string;

  @ApiProperty({
    description: 'Mot de passe sécurisé (au moins 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial)',
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
  @Matches(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Le mot de passe doit contenir au moins un caractère spécial' })
  motDePasse: string;
}
