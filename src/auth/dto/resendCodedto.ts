import { IsString, IsPhoneNumber } from 'class-validator';

export class ResendCodeDto {
  @IsPhoneNumber('CM', { message: 'Format de téléphone invalide' })
  phone: string;

  @IsString()
  type: 'registration' | 'phone_update';

  @IsString()
  userId?: string; // Optionnel, requis seulement pour phone_update
}