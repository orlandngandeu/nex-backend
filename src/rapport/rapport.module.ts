// src/rapport/rapport.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RapportService } from './rapport.service';
import { RapportController } from './rapport.controller';
import { Utilisateur } from '../auth/auth.entity';
import { Contract } from '../contrat/entities/contrat.entity';
import { Conge } from '../conge/conge.entity';
import { Entreprise } from '../entreprise/entreprise.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Utilisateur,
      Contract,
      Conge,
      Entreprise,
      
    ]),
  ],
  controllers: [RapportController],
  providers: [RapportService],
  exports: [RapportService],
})
export class RapportModule {}