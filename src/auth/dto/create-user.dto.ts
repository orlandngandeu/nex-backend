import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../utils/enums/enums';

export class CreateUserDto {
  @IsString()
  nom: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber()
  telephone: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  motDePasse?: string;

  @IsEnum(Role)
  role: Role;
}
