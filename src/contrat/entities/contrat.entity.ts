import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { Utilisateur } from '../../auth/auth.entity';
import { tache } from '../../tache/entities/tache.entity';
import { commentaire } from '../../commentaire/entities/commentaire.entity';

@Entity()
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  idContrat: string;

  @ManyToOne(() => Utilisateur, { nullable: true })
  @JoinColumn({ name: 'utilisateurId' })
  utilisateur: Utilisateur;

  // Tableau contenant latitude et longitude
  @Column('float', { array: true })
  lieu: number[];

  @Column({ type: 'timestamp' })
  horaireDebut: Date;

  @Column({ type: 'timestamp' })
  horaireFin: Date;

  @Column({ nullable: true })
  description: string;

  @Column()
  poste: string;

  @Column({ nullable: true })
  pause: string;

  @ManyToMany(() => tache, { cascade: true })
  @JoinTable()
  taches: tache[];

  @OneToMany(() => commentaire, commentaire => commentaire.contrat, { cascade: true })
  commentaires: commentaire[];

  @CreateDateColumn({ type: 'timestamp' })
  dateCreation: Date;

  @Column({ default: false })
  estGabarit: boolean;

  @Column({ nullable: true })
  nomGabarit: string;

  // Nouveau champ pour marquer si le contrat est terminé
  @Column({ default: false })
  estTermine: boolean;


  @Column({ nullable: true })
  remarques: string;

  @Column({ default: false })
  estRepetitif: boolean;
  
  // Nombre de jours pendant lesquels répéter
  @Column({ nullable: true })
  nombreJoursRepetition: number;
  
  // Compteur des répétitions créées
  @Column({ default: 0 })
  repetitionsCreees: number;
  
  // ID du contrat parent (pour les contrats générés par répétition)
  @Column({ nullable: true })
  contratParentId: string;

   @Column({ type: 'date' })
  datesupression: Date;
}