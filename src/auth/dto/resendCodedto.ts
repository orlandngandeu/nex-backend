import { IsString, IsPhoneNumber } from 'class-validator';

export class ResendCodeDto {
  @IsPhoneNumber()
  phone: string;

  @IsString()
  type: 'registration' | 'phone_update';

  @IsString()
  userId?: string; // Optionnel, requis seulement pour phone_update
}
