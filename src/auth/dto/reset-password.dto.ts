import { IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Numéro de téléphone associé au compte' })
  @IsPhoneNumber()
  telephone: string;

  @ApiProperty({ description: 'Code de vérification reçu par SMS' })
  @IsString()
  codeVerification: string;

  @ApiProperty({ description: 'Nouveau mot de passe (min. 6 caractères)' })
  @IsString()
  @MinLength(6)
  nouveauMotDePasse: string;
}
