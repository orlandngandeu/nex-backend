import { IsPhoneNumber } from 'class-validator';

export class ForgotPasswordDto {
  @IsPhoneNumber()
  telephone: string;
}