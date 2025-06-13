// src/utilisateurs/role.enum.ts
export enum Role {
    SuperAdmin = 'superAdmin', // Crée les administrateurs
    Administrateur = 'administrateur', // Crée les entreprises et assigne les gestionnaires
    Gestionnaire = 'gestionnaire', // Gère les employés de son entreprise
    Employe = 'employe', // Employé standard
  }