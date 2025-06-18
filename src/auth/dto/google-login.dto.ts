import { IsString, IsNotEmpty,IsOptional} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleCallbackQueryDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  error?: string;
}