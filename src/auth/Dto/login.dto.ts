import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
export class LoginDto{

    @IsNotEmpty()
    @IsEmail({}, {message: "enter correct email"})
    readonly email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    readonly motDePasse: string; 
}