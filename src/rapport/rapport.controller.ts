// src/rapport/rapport.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseUUIDPipe,
  HttpException,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { RapportService } from './rapport.service';
import {
  RechercheEmployeDto,
  FiltreCongeDto,
  FiltreContratDto,
  
} from './dto/rapport-employe.dto';
import { RechercheStockDto,
  FiltreStockDto} from './dto/rapport-stock.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Rapports')
@Controller('rapports')
//@UseGuards(JwtAuthGuard)
export class RapportController {
  constructor(private readonly rapportService: RapportService) {}

  // ================= RAPPORTS EMPLOYÉS =================

  @Get('employe/:id')
  @ApiOperation({ summary: 'Obtenir le rapport détaillé d\'un employé' })
  @ApiResponse({ status: 200, description: 'Rapport généré avec succès' })
  @ApiResponse({ status: 404, description: 'Employé non trouvé' })
  @ApiQuery({ name: 'statutConge', required: false, enum: ['EN_ATTENTE', 'ACCEPTE', 'REFUSE', 'ANNULE', 'EXPIRE'] })
  @ApiQuery({ name: 'statutContrat', required: false, enum: ['a_temps', 'en_retard', 'a_combler'] })
  @ApiQuery({ name: 'dateDebutConge', required: false, type: String })
  @ApiQuery({ name: 'dateFinConge', required: false, type: String })
  @ApiQuery({ name: 'dateDebutContrat', required: false, type: String })
  @ApiQuery({ name: 'dateFinContrat', required: false, type: String })
  async getRapportEmploye(
    @Param('id', ParseUUIDPipe) idUtilisateur: string,
    @Query('statutConge') statutConge?: string,
    @Query('statutContrat') statutContrat?: 'a_temps' | 'en_retard' | 'a_combler',
    @Query('dateDebutConge') dateDebutConge?: string,
    @Query('dateFinConge') dateFinConge?: string,
    @Query('dateDebutContrat') dateDebutContrat?: string,
    @Query('dateFinContrat') dateFinContrat?: string,
  ) {
    try {
      const filtreConge: FiltreCongeDto = {};
      const filtreContrat: FiltreContratDto = {};

      if (statutConge) filtreConge.statut = statutConge as any;
      if (dateDebutConge) filtreConge.dateDebut = dateDebutConge;
      if (dateFinConge) filtreConge.dateFin = dateFinConge;

      if (statutContrat) filtreContrat.statutContrat = statutContrat;
      if (dateDebutContrat) filtreContrat.dateDebut = dateDebutContrat;
      if (dateFinContrat) filtreContrat.dateFin = dateFinContrat;

      return await this.rapportService.getRapportEmploye(
        idUtilisateur,
        Object.keys(filtreConge).length > 0 ? filtreConge : undefined,
        Object.keys(filtreContrat).length > 0 ? filtreContrat : undefined
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur lors de la génération du rapport',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('employes/recherche')
  @ApiOperation({ summary: 'Rechercher des employés par critères' })
  @ApiResponse({ status: 200, description: 'Liste des employés trouvés' })
  async rechercherEmployes(@Body() criteres: RechercheEmployeDto) {
    try {
      return await this.rapportService.rechercherEmployes(criteres);
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la recherche d\'employés',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('entreprise/:id')
  @ApiOperation({ summary: 'Obtenir le rapport global d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Rapport entreprise généré avec succès' })
  @ApiResponse({ status: 404, description: 'Entreprise non trouvée' })
  async getRapportEntreprise(@Param('id', ParseIntPipe) idEntreprise: number) {
    try {
      return await this.rapportService.getRapportEntreprise(idEntreprise);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur lors de la génération du rapport entreprise',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ================= RAPPORTS STOCKS =================

  // @Get('stock/:id')
  // @ApiOperation({ summary: 'Obtenir le rapport détaillé d\'un stock/produit' })
  // @ApiResponse({ status: 200, description: 'Rapport stock généré avec succès' })
  // @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  // @ApiQuery({ name: 'etatStock', required: false, enum: ['disponible', 'rupture', 'commande'] })
  // @ApiQuery({ name: 'dateDebut', required: false, type: String })
  // @ApiQuery({ name: 'dateFin', required: false, type: String })
  // async getRapportStock(
  //   @Param('id', ParseIntPipe) idProduit: number,
  //   @Query('etatStock') etatStock?: 'disponible' | 'rupture' | 'commande',
  //   @Query('dateDebut') dateDebut?: string,
  //   @Query('dateFin') dateFin?: string,
  // ) {
  //   try {
  //     const filtre: FiltreStockDto = {};
  //     if (etatStock) filtre.etatStock = etatStock;
  //     if (dateDebut) filtre.dateDebut = dateDebut;
  //     if (dateFin) filtre.dateFin = dateFin;

  //     return await this.rapportService.getRapportStock(
  //       idProduit,
  //       Object.keys(filtre).length > 0 ? filtre : undefined
  //     );
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Erreur lors de la génération du rapport stock',
  //       error.status || HttpStatus.INTERNAL_SERVER_ERROR
  //     );
  //   }
  // }

  // @Post('stocks/recherche')
  // @ApiOperation({ summary: 'Rechercher des stocks par critères' })
  // @ApiResponse({ status: 200, description: 'Liste des stocks trouvés' })
  // async rechercherStocks(@Body() criteres: RechercheStockDto) {
  //   try {
  //     return await this.rapportService.rechercherStocks(criteres);
  //   } catch (error) {
  //     throw new HttpException(
  //       'Erreur lors de la recherche de stocks',
  //       HttpStatus.INTERNAL_SERVER_ERROR
  //     );
  //   }
  // }

  // ================= EXPORTS =================

  @Get('employe/:id/export')
  @ApiOperation({ summary: 'Exporter le rapport d\'un employé' })
  @ApiResponse({ status: 200, description: 'Données prêtes pour l\'export' })
  async exporterRapportEmploye(@Param('id', ParseUUIDPipe) idUtilisateur: string) {
    try {
      return await this.rapportService.exporterRapportEmploye(idUtilisateur);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur lors de l\'export du rapport employé',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('entreprise/:id/export')
  @ApiOperation({ summary: 'Exporter le rapport d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Données prêtes pour l\'export' })
  async exporterRapportEntreprise(@Param('id', ParseIntPipe) idEntreprise: number) {
    try {
      return await this.rapportService.exporterRapportEntreprise(idEntreprise);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur lors de l\'export du rapport entreprise',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // @Get('stock/:id/export')
  // @ApiOperation({ summary: 'Exporter le rapport d\'un stock' })
  // @ApiResponse({ status: 200, description: 'Données prêtes pour l\'export' })
  // async exporterRapportStock(@Param('id', ParseIntPipe) idProduit: number) {
  //   try {
  //     return await this.rapportService.exporterRapportStock(idProduit);
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Erreur lors de l\'export du rapport stock',
  //       error.status || HttpStatus.INTERNAL_SERVER_ERROR
  //     );
  //   }
  // }

  // ================= ENDPOINTS UTILITAIRES =================

  @Get('employes/tous')
  @ApiOperation({ summary: 'Obtenir la liste de tous les employés' })
  @ApiResponse({ status: 200, description: 'Liste complète des employés' })
  async getTousEmployes() {
    try {
      return await this.rapportService.rechercherEmployes({});
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération des employés',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // @Get('stocks/tous')
  // @ApiOperation({ summary: 'Obtenir la liste de tous les stocks' })
  // @ApiResponse({ status: 200, description: 'Liste complète des stocks' })
  // async getTousStocks() {
  //   try {
  //     return await this.rapportService.rechercherStocks({});
  //   } catch (error) {
  //     throw new HttpException(
  //       'Erreur lors de la récupération des stocks',
  //       HttpStatus.INTERNAL_SERVER_ERROR
  //     );
  //   }
  // }

  // @Get('stocks/alerte')
  // @ApiOperation({ summary: 'Obtenir les stocks en alerte (rupture ou seuil minimum)' })
  // @ApiResponse({ status: 200, description: 'Liste des stocks en alerte' })
  // async getStocksEnAlerte() {
  //   try {
  //     const stocks = await this.rapportService.rechercherStocks({});
  //     return stocks.filter(stock => 
  //       stock.quantiteStock <= stock.seuilMinimum || stock.quantiteStock <= 0
  //     );
  //   } catch (error) {
  //     throw new HttpException(
  //       'Erreur lors de la récupération des stocks en alerte',
  //       HttpStatus.INTERNAL_SERVER_ERROR
  //     );
  //   }
  // }
}