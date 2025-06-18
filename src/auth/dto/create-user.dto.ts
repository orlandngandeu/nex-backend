import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../utils/enums/enums';

export class CreateUserDto {
  @ApiProperty({ description: 'Nom complet de l\'utilisateur' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ description: 'Adresse email de l\'utilisateur (optionnelle)' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Numéro de téléphone au format international' })
  @IsPhoneNumber()
  telephone: string;

  @ApiPropertyOptional({ description: 'Mot de passe (optionnel), minimum 6 caractères' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  motDePasse?: string;

  @ApiProperty({ enum: Role, description: 'Rôle de l\'utilisateur' })
  @IsEnum(Role)
  role: Role;
}
