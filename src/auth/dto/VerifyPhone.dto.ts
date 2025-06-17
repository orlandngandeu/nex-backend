import { IsString, IsPhoneNumber, MinLength, Matches } from 'class-validator';

// DTO pour la vérification du numéro de téléphone
export class VerifyPhoneDto {
  @IsPhoneNumber()
  phone: string;

  @IsString()
  @MinLength(6, { message: 'Le code doit contenir 6 chiffres' })
  code: string;
}