import { IsString, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Numéro de téléphone de l\'utilisateur' })
  @IsPhoneNumber()
  telephone: string;

  @ApiProperty({ description: 'Mot de passe de l\'utilisateur' })
  @IsString()
  motDePasse: string;
}
