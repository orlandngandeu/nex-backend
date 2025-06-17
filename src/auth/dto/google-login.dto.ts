import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google ID Token obtenu depuis le client',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzAyN...'
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}