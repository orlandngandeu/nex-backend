import { IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsPhoneNumber()
  telephone: string;

  @IsString()
  codeVerification: string;

  @IsString()
  @MinLength(6)
  nouveauMotDePasse: string;
}