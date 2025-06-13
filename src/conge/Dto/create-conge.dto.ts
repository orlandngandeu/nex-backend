// create-conge.dto.ts
import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCongeDto {
  @IsNotEmpty()
  @IsString()
  motif: string;

  @IsDate()
  @Type(() => Date)
  dateDebut: Date;

  @IsDate()
  @Type(() => Date)
  dateFin: Date;
}
