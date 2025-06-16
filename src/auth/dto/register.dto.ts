import { IsString, IsPhoneNumber, MinLength, IsEmail, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  nom: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber() 
  telephone: string;

  @IsString()
  @MinLength(6)
  motDePasse: string;
}
