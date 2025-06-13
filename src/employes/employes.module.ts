import { Module } from '@nestjs/common';
import { EmployesController } from './employes.controller';
import { EmployesService } from './employes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Utilisateur } from 'src/auth/auth.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Entreprise } from 'src/entreprise/entreprise.entity';

@Module({
  imports:[
    AuthModule,
    TypeOrmModule.forFeature([Utilisateur, Entreprise]),
  ],
  controllers: [EmployesController],
  providers: [EmployesService],
  exports: [
    EmployesModule,
    TypeOrmModule.forFeature([Utilisateur]),
    EmployesService
  ]
})
export class EmployesModule {}
