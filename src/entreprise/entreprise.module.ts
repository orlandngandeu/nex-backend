import { Module } from '@nestjs/common';
import { EntrepriseController } from './entreprise.controller';
import { EntrepriseService } from './entreprise.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entreprise } from './entreprise.entity';
import { Utilisateur } from 'src/auth/auth.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entreprise, Utilisateur]), // Ajoutez les deux entités
  ],
  controllers: [EntrepriseController],
  providers: [EntrepriseService],
  exports: [EntrepriseService],
})
export class EntrepriseModule {}
