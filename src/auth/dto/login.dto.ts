import { IsString, IsPhoneNumber } from 'class-validator';


export class LoginDto {
  @IsPhoneNumber()
  telephone: string;

  @IsString()
  motDePasse: string;
}