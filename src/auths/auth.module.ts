import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { Utilisateur } from "../auth/auth.entity"



@Module({
  imports: [TypeOrmModule.forFeature([Utilisateur])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModules {}
