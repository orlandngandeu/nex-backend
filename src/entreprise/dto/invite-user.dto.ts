import { IsUUID, IsNotEmpty } from 'class-validator';

export class InviteUserDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}