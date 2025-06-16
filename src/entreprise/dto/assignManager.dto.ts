import { IsUUID,IsNotEmpty } from "class-validator";

export class AssignManagerDto {
  @IsUUID()
  @IsNotEmpty()
  newManagerId: string;
}