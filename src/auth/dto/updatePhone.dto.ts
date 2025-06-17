import { IsPhoneNumber } from 'class-validator';

export class UpdatePhoneDto {
  @IsPhoneNumber()
  nouveauTelephone: string;
}
