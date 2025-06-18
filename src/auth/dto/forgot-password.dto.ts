import { IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Numéro de téléphone pour réinitialisation du mot de passe' })
  @IsPhoneNumber()
  telephone: string;
}
