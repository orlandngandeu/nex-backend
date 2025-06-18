import { IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePhoneDto {
  @ApiProperty({ description: 'Nouveau numéro de téléphone' })
  @IsPhoneNumber()
  nouveauTelephone: string;
}
