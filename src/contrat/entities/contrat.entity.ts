import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Utilisateur } from '../../User/entities/utilisateur.entity';
import { tache } from '../../tache/entities/tache.entity';
import { Point } from 'src/utils/types/type';
import { Presence } from 'src/presence/entities/presence.entity';
import { Alerte } from 'src/alertes/entities/alertes.entity';

@Entity()
export class Contrat {
  @PrimaryGeneratedColumn('uuid')
  idContrat: string;

  @ManyToOne(() => Utilisateur, { nullable: true })
  @JoinColumn({ name: 'utilisateurId' })
  utilisateur: Utilisateur;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326, // Système de coordonnées WGS 84 (standard GPS)
  })
  lieu: Point;

  @Column({ type: 'timestamp' })
  dateDebut: Date;

  @Column({ type: 'timestamp' })
  dateFin: Date;

  @Column({ nullable: true })
  description: string;

  @Column()
  poste: string;

  // la duree de la pause d'un contract en heures.
  @Column({ nullable: true })
  pause: number;

  @Column({ default: false })
  estGabarit: boolean;

  @Column({ nullable: true })
  nomGabarit: string;

  @Column({ default: false })
  estRepetitif: boolean;

  // Nombre de jours répétition
  @Column({ nullable: true })
  nombreJoursRepetition: number;

  @CreateDateColumn({ type: 'timestamp' })
  dateCreation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  update_at: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  delete_at: Date | null;

  @ManyToMany(() => tache, { cascade: ['insert', 'update'] })
  @JoinTable()
  taches: tache[];

  @OneToOne(() => Presence, (presence) => presence.contrat)
  presence: Presence;

  @OneToMany(() => Alerte, (alerte) => alerte.contract)
  alerte: Alerte;
}
