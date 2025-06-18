import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ description: 'Ancien mot de passe' })
  @IsString()
  ancienMotDePasse: string;

  @ApiProperty({
    description:
      'Nouveau mot de passe sécurisé (8 caractères min, 1 majuscule, 1 chiffre, 1 caractère spécial)',
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
  @Matches(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Le mot de passe doit contenir au moins un caractère spécial' })
  nouveauMotDePasse: string;
}
