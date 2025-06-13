import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { Role } from "../../enums/role.enums";
export class SignUpDto{
    @IsNotEmpty()
    @IsString()
    readonly nom: string; 
    
    @IsNotEmpty()
    @IsEmail({}, {message: "enter correct email"})
    readonly email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    readonly motDePasse: string; 

    @IsNotEmpty()
    @IsString()
    telephone: string ;

    @IsOptional()
    @IsNumber()
    soldeConges: number;

    @IsNotEmpty()
    readonly role: Role

}