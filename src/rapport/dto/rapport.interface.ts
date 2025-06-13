import { StatutConge } from '../../conge/conge.entity';
export interface RapportEmployeInterface {
    employe: {
      idUtilisateur: string;
      nom: string;
      email: string;
      telephone: string;
      poste: string;
      soldeConges: number;
      salairePerheure: number;
      role: string;
      entreprise?: {
        nom: string;
        siret: string;
      };
    };
    conges: {
      id: number;
      statut: StatutConge;
      motif: string;
      dateDebut: Date;
      dateFin: Date;
      dureeJours: number;
      motifRefus?: string | null;

    }[];
    contrats: {
      idContrat: string;
      horaireDebut: Date;
      horaireFin: Date;
      description: string;
      poste: string;
      statutContrat: 'a_temps' | 'en_retard' | 'a_combler';
      taches: any[];
      //equipements: any[];
      commentaires: any[];
      lieu: number[];
    }[];
    statistiques: {
      totalConges: number;
      congesApprouves: number;
      congesEnAttente: number;
      congesRefuses: number;
      totalContrats: number;
      contratsEnCours: number;
      contratsTermines: number;
    };
  }
  
  export interface RapportEntrepriseInterface {
    entreprise: {
      idEtreprise: number;
      nom: string;
      siret: string;
      type: string;
      domaine: string;
    };
    employes: {
      disponibles: any[];
      enContratActif: any[];
      total: number;
    };
    soldeCongesGlobal: {
      totalSolde: number;
      moyenneSolde: number;
      employesPlusDeConges: any[];
      employesMoinsDeConges: any[];
    };
    statistiques: {
      tauxActivite: number;
      nombreTotalContrats: number;
      nombreCongesEnCours: number;
    };
  }
  
  export interface RapportStockInterface {
    produit: {
      idProduit: number;
      nom: string;
      description: string;
      prixUnitaire: number;
      quantiteStock: number;
      seuilMinimum: number;
      codeBarres: string;
      uniteMesure: string;
      etatStock: 'disponible' | 'rupture' | 'commande';
    };
    mouvements: {
      id: string;
      type: string;
      quantity: number;
      reference: string;
      notes: string;
      createdAt: Date;
    }[];
    historique: {
      utilisations: any[];
      affectations: any[];
    };
    statistiques: {
      totalEntrees: number;
      totalSorties: number;
      valeurStock: number;
      rotationStock: number;
    };
    fournisseur?: {
      nom: string;
      contact: string;
    };
    categorie?: {
      nom: string;
      description: string;
    };
  }