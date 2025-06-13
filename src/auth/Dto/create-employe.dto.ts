import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Role } from "../../enums/role.enums";
import { ApiProperty , ApiOperation} from "@nestjs/swagger";
export class CreateEmployeDto{

    @IsNotEmpty()
    @IsString()
    @ApiProperty({example:'joe doe'})
    readonly nom: string ;

    @IsNotEmpty()
    @IsEmail({}, {message: "enter correct email"})
    @ApiProperty({example:'joedoe@gmail.com'})
    readonly email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @ApiProperty({example:'password123'})
    readonly motDePasse: string; 

    @IsNotEmpty()
    @ApiProperty({
example: 'ADMIN'})
    readonly role: Role
}