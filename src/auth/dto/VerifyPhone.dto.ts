import { IsString, IsPhoneNumber, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPhoneDto {
 

  @ApiProperty({ description: 'Code de vérification (6 chiffres)' })
  @IsString()
  @MinLength(6, { message: 'Le code doit contenir 6 chiffres' })
  code: string;
}
