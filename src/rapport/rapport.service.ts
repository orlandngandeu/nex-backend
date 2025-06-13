// src/rapport/rapport.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { Utilisateur } from '../auth/auth.entity';
import { Contract } from '../contrat/entities/contrat.entity';
import { Conge, StatutConge } from '../conge/conge.entity';
import { Entreprise } from '../entreprise/entreprise.entity';
//import { Produit } from '../stock/produit.entity';
//import { StockMovement } from '../stock/stock-mouvement.entity';
import {
  RechercheEmployeDto,
  FiltreCongeDto,
  FiltreContratDto,
 
} from './dto/rapport-employe.dto';
import { RechercheStockDto,
  FiltreStockDto} from './dto/rapport-stock.dto';
import {
  RapportEmployeInterface,
  RapportEntrepriseInterface,
  RapportStockInterface
} from './dto/rapport.interface';

@Injectable()
export class RapportService {
  constructor(
    @InjectRepository(Utilisateur)
    private readonly utilisateurRepository: Repository<Utilisateur>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Conge)
    private readonly congeRepository: Repository<Conge>,
    @InjectRepository(Entreprise)
    private readonly entrepriseRepository: Repository<Entreprise>,
    // @InjectRepository(Produit)
    // private readonly produitRepository: Repository<Produit>,
    // @InjectRepository(StockMovement)
    // private readonly stockMovementRepository: Repository<StockMovement>,
  ) {}

  // ================= RAPPORTS EMPLOYÉS =================

  async getRapportEmploye(
    idUtilisateur: string,
    filtreConge?: FiltreCongeDto,
    filtreContrat?: FiltreContratDto
  ): Promise<RapportEmployeInterface> {
    const employe = await this.utilisateurRepository.findOne({
      where: { idUtilisateur },
      relations: ['entreprise', 'conges', 'fichesPaie']
    });

    if (!employe) {
      throw new NotFoundException('Employé non trouvé');
    }

    // Récupération des congés avec filtres
    const whereConge: any = { employe: { idUtilisateur } };
    if (filtreConge?.statut) {
      whereConge.statut = filtreConge.statut;
    }
    if (filtreConge?.dateDebut && filtreConge?.dateFin) {
      whereConge.dateDebut = Between(new Date(filtreConge.dateDebut), new Date(filtreConge.dateFin));
    }

    const conges = await this.congeRepository.find({
      where: whereConge,
      order: { createdAt: 'DESC' }
    });

    // Récupération des contrats avec filtres
    const whereContrat: any = { utilisateur: { idUtilisateur } };
    if (filtreContrat?.dateDebut && filtreContrat?.dateFin) {
      whereContrat.horaireDebut = Between(new Date(filtreContrat.dateDebut), new Date(filtreContrat.dateFin));
    }

    const contrats = await this.contractRepository.find({
      where: whereContrat,
      relations: ['taches', 'equipements', 'commentaires'],
      order: { dateCreation: 'DESC' }
    });

    // Classification des contrats
    const contratsAvecStatut = contrats.map(contrat => {
      const maintenant = new Date();
      let statutContrat: 'a_temps' | 'en_retard' | 'a_combler';

      if (!contrat.utilisateur) {
        statutContrat = 'a_combler';
      } else if (contrat.horaireFin < maintenant) {
        statutContrat = 'a_temps';
      } else if (contrat.horaireDebut < maintenant && contrat.horaireFin > maintenant) {
        statutContrat = 'en_retard';
      } else {
        statutContrat = 'a_temps';
      }

      return {
        ...contrat,
        statutContrat
      };
    });

    // Filtrage par statut de contrat si spécifié
    const contratsFiltres = filtreContrat?.statutContrat
      ? contratsAvecStatut.filter(c => c.statutContrat === filtreContrat.statutContrat)
      : contratsAvecStatut;

    // Calcul des statistiques
    const statistiques = {
      totalConges: conges.length,
      congesApprouves: conges.filter(c => c.statut === StatutConge.ACCEPTE).length,
      congesEnAttente: conges.filter(c => c.statut === StatutConge.EN_ATTENTE).length,
      congesRefuses: conges.filter(c => c.statut === StatutConge.REFUSE).length,
      totalContrats: contrats.length,
      contratsEnCours: contratsAvecStatut.filter(c => {
        const maintenant = new Date();
        return c.horaireDebut <= maintenant && c.horaireFin >= maintenant;
      }).length,
      contratsTermines: contratsAvecStatut.filter(c => c.horaireFin < new Date()).length,
    };

    return {
      employe: {
        idUtilisateur: employe.idUtilisateur,
        nom: employe.nom,
        email: employe.email,
        telephone: employe.telephone,
        poste: employe.poste,
        soldeConges: employe.soldeConges,
        salairePerheure: employe.salairePerheure,
        role: employe.role,
        entreprise: employe.entreprise ? {
          nom: employe.entreprise.nom,
          siret: employe.entreprise.siret
        } : undefined
      },
      conges: conges.map(conge => ({
        id: conge.id,
        statut: conge.statut,
        motif: conge.motif,
        dateDebut: conge.dateDebut,
        dateFin: conge.dateFin,
        dureeJours: conge.dureeJours,
        motifRefus: conge.motifRefus ?? undefined,
      })),
      contrats: contratsFiltres.map(contrat => ({
        idContrat: contrat.idContrat,
        horaireDebut: contrat.horaireDebut,
        horaireFin: contrat.horaireFin,
        description: contrat.description,
        poste: contrat.poste,
        statutContrat: contrat.statutContrat,
        taches: contrat.taches || [],
        //equipements: contrat.equipements || [],
        commentaires: contrat.commentaires || [],
        lieu: contrat.lieu
      })),
      statistiques
    };
  }

  async rechercherEmployes(criteres: RechercheEmployeDto): Promise<Utilisateur[]> {
    const where: any = {};

    if (criteres.nom) {
      where.nom = Like(`%${criteres.nom}%`);
    }
    if (criteres.email) {
      where.email = Like(`%${criteres.email}%`);
    }
    if (criteres.entrepriseId) {
      where.entreprise = { idEtreprise: criteres.entrepriseId };
    }

    return await this.utilisateurRepository.find({
      where,
      relations: ['entreprise'],
      order: { nom: 'ASC' }
    });
  }

  async getRapportEntreprise(idEtreprise: number): Promise<RapportEntrepriseInterface> {
    const entreprise = await this.entrepriseRepository.findOne({
      where: { idEtreprise },
      relations: ['employe', 'gestionnaire']
    });

    if (!entreprise) {
      throw new NotFoundException('Entreprise non trouvée');
    }

    // Classification des employés (disponibles vs en contrat actif)
    const maintenant = new Date();
    const employesAvecContrats = await Promise.all(
      entreprise.employe.map(async (employe) => {
        const contratsActifs = await this.contractRepository.find({
          where: {
            utilisateur: { idUtilisateur: employe.idUtilisateur },
            horaireDebut: Between(new Date(maintenant.getTime() - 30 * 24 * 60 * 60 * 1000), maintenant),
            horaireFin: Between(maintenant, new Date(maintenant.getTime() + 30 * 24 * 60 * 60 * 1000))
          }
        });
        return {
          ...employe,
          contratsActifs: contratsActifs.length > 0
        };
      })
    );

    const employesDisponibles = employesAvecContrats.filter(e => !e.contratsActifs);
    const employesEnContrat = employesAvecContrats.filter(e => e.contratsActifs);

    // Calcul du solde de congés global
    const totalSoldeConges = entreprise.employe.reduce((total, emp) => total + emp.soldeConges, 0);
    const moyenneSoldeConges = totalSoldeConges / entreprise.employe.length;

    const employesPlusDeConges = entreprise.employe
      .filter(emp => emp.soldeConges > moyenneSoldeConges)
      .sort((a, b) => b.soldeConges - a.soldeConges)
      .slice(0, 5);

    const employesMoinsDeConges = entreprise.employe
      .filter(emp => emp.soldeConges < moyenneSoldeConges)
      .sort((a, b) => a.soldeConges - b.soldeConges)
      .slice(0, 5);

    // Statistiques générales
    const totalContrats = await this.contractRepository.count({
      where: {
        utilisateur: { entreprise: { idEtreprise } }
      }
    });

    const congesEnCours = await this.congeRepository.count({
      where: {
        employe: { entreprise: { idEtreprise } },
        statut: In([StatutConge.EN_ATTENTE, StatutConge.ACCEPTE])
      }
    });

    const tauxActivite = (employesEnContrat.length / entreprise.employe.length) * 100;

    return {
      entreprise: {
        idEtreprise: entreprise.idEtreprise,
        nom: entreprise.nom,
        siret: entreprise.siret,
        type: entreprise.type,
        domaine: entreprise.domaine
      },
      employes: {
        disponibles: employesDisponibles,
        enContratActif: employesEnContrat,
        total: entreprise.employe.length
      },
      soldeCongesGlobal: {
        totalSolde: totalSoldeConges,
        moyenneSolde: Math.round(moyenneSoldeConges * 100) / 100,
        employesPlusDeConges,
        employesMoinsDeConges
      },
      statistiques: {
        tauxActivite: Math.round(tauxActivite * 100) / 100,
        nombreTotalContrats: totalContrats,
        nombreCongesEnCours: congesEnCours
      }
    };
  }

  // ================= RAPPORTS STOCKS =================

  // async getRapportStock(
  //   idProduit: number,
  //   filtre?: FiltreStockDto
  // ): Promise<RapportStockInterface> {
  //   const produit = await this.produitRepository.findOne({
  //     where: { idProduit },
  //     relations: ['fournisseur', 'categorie', 'stockMovements']
  //   });

  //   if (!produit) {
  //     throw new NotFoundException('Produit non trouvé');
  //   }

  //   // Détermination de l'état du stock
  //   let etatStock: 'disponible' | 'rupture' | 'commande';
  //   if (produit.quantiteStock <= 0) {
  //     etatStock = 'rupture';
  //   } else if (produit.quantiteStock <= produit.seuilMinimum) {
  //     etatStock = 'commande';
  //   } else {
  //     etatStock = 'disponible';
  //   }

  //   // Filtrage par état si spécifié
  //   if (filtre?.etatStock && filtre.etatStock !== etatStock) {
  //     throw new NotFoundException('Aucun produit ne correspond à ce filtre d\'état');
  //   }

  //   // Récupération des mouvements de stock avec filtres
  //   const whereMouvement: any = { product: { idProduit } };
  //   if (filtre?.dateDebut && filtre?.dateFin) {
  //     whereMouvement.createdAt = Between(new Date(filtre.dateDebut), new Date(filtre.dateFin));
  //   }

  //   const mouvements = await this.stockMovementRepository.find({
  //     where: whereMouvement,
  //     order: { createdAt: 'DESC' }
  //   });

  //   // Calcul des statistiques
  //   const totalEntrees = mouvements
  //     .filter(m => m.type === 'purchase' || m.type === 'return')
  //     .reduce((total, m) => total + m.quantity, 0);

  //   const totalSorties = mouvements
  //     .filter(m => m.type === 'usage')
  //     .reduce((total, m) => total + m.quantity, 0);

  //   const valeurStock = produit.quantiteStock * Number(produit.prixUnitaire);
  //   const rotationStock = totalSorties > 0 ? totalEntrees / totalSorties : 0;

  //   return {
  //     produit: {
  //       idProduit: produit.idProduit,
  //       nom: produit.nom,
  //       description: produit.description,
  //       prixUnitaire: Number(produit.prixUnitaire),
  //       quantiteStock: produit.quantiteStock,
  //       seuilMinimum: produit.seuilMinimum,
  //       codeBarres: produit.codeBarres,
  //       uniteMesure: produit.uniteMesure,
  //       etatStock
  //     },
  //     mouvements: mouvements.map(mouvement => ({
  //       id: mouvement.id,
  //       type: mouvement.type,
  //       quantity: mouvement.quantity,
  //       reference: mouvement.reference,
  //       notes: mouvement.notes,
  //       createdAt: mouvement.createdAt
  //     })),
  //     historique: {
  //       utilisations: mouvements.filter(m => m.type === 'usage'),
  //       affectations: mouvements.filter(m => m.cleaningProcessId)
  //     },
  //     statistiques: {
  //       totalEntrees,
  //       totalSorties,
  //       valeurStock: Math.round(valeurStock * 100) / 100,
  //       rotationStock: Math.round(rotationStock * 100) / 100
  //     },
  //     fournisseur: produit.fournisseur ? {
  //       nom: produit.fournisseur.nom,
  //       contact: produit.fournisseur.telephone,
  //     } : undefined,
  //     categorie: produit.categorie ? {
  //       nom: produit.categorie.nom,
  //       description: produit.categorie.description
  //     } : undefined
  //   };
  // }

  // async rechercherStocks(criteres: RechercheStockDto): Promise<Produit[]> {
  //   const where: any = {};

  //   if (criteres.nom) {
  //     where.nom = Like(`%${criteres.nom}%`);
  //   }
  //   if (criteres.codeBarres) {
  //     where.codeBarres = criteres.codeBarres;
  //   }
  //   if (criteres.reference) {
  //     where.description = Like(`%${criteres.reference}%`);
  //   }

  //   return await this.produitRepository.find({
  //     where,
  //     relations: ['fournisseur', 'categorie'],
  //     order: { nom: 'ASC' }
  //   });
  // }

  // ================= EXPORT =================

  async exporterRapportEmploye(idUtilisateur: string): Promise<any> {
    const rapport = await this.getRapportEmploye(idUtilisateur);
    return {
      type: 'rapport_employe',
      dateGeneration: new Date(),
      ...rapport
    };
  }

  async exporterRapportEntreprise(idEntreprise: number): Promise<any> {
    const rapport = await this.getRapportEntreprise(idEntreprise);
    return {
      type: 'rapport_entreprise',
      dateGeneration: new Date(),
      ...rapport
    };
  }

  // async exporterRapportStock(idProduit: number): Promise<any> {
  //   const rapport = await this.getRapportStock(idProduit);
  //   return {
  //     type: 'rapport_stock',
  //     dateGeneration: new Date(),
  //     ...rapport
  //   };
  // }
}