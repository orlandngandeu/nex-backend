import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { Role } from "../../enums/role.enums";



export class UpdateEmployesDto{
    @IsOptional()
    @IsString()
    readonly nom: string; 
    
    @IsOptional()
    @IsEmail({}, {message: "enter correct email"})
    readonly email: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    readonly motDePasse: string; 

    @IsNotEmpty()
    @IsOptional()
    @IsString()
    telephone: string ;

    @IsOptional()
    @IsNumber()
    soldeConges: number;

    @IsNotEmpty()
    @IsOptional()
    readonly role: Role

}