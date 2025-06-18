import { IsEmail, IsOptional, IsPhoneNumber, IsString, MinLength, IsEnum } from 'class-validator';
import { Role } from 'src/utils/enums/enums';

export class UpdateUtilisateurDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  telephone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  motDePasse?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Le rôle fourni est invalide' })
  role?: Role;

}
