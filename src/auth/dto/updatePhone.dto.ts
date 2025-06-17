import {  IsPhoneNumber } from 'class-validator';

export class UpdatePhoneDto {
  @IsPhoneNumber('CM', { message: 'Format de téléphone invalide' })
  nouveauTelephone: string;
}