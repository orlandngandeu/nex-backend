import { IsString, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResendCodeDto {
  @ApiProperty({ description: 'Numéro de téléphone au format international' })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    description: 'Type de demande de renvoi de code',
    enum: ['registration', 'phone_update'],
  })
  @IsString()
  type: 'registration' | 'phone_update';

  @ApiPropertyOptional({
    description: 'Identifiant de l\'utilisateur (requis seulement pour "phone_update")',
  })
  @IsString()
  userId?: string;
}

