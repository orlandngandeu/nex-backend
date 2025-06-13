import { IsEmail, IsNumber } from "class-validator";

export class CreateInvitationDto {
    @IsEmail()
    email: string;
  
    @IsNumber()
    entrepriseId: number;
  }