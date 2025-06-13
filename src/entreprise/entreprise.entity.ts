// src/entreprise/entities/entreprise.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Utilisateur } from 'src/auth/auth.entity';
import { Invitation } from 'src/invitation/invitation.entity';

@Entity()
export class Entreprise {
  @PrimaryGeneratedColumn()
  idEtreprise: number;

  @Column()
  nom: string;

  @Column({ type: 'date' })
  dateCreation: Date;

    @Column({ type: 'date' })
  datesupression: Date;

  @Column()
  adresse: string;

  @Column()
  domaine: string;

  @ManyToOne(() => Utilisateur, (utilisateur) => utilisateur.entreprisesGerees)
  gestionnaire: Utilisateur;

  @OneToMany(() => Utilisateur, (utilisateur) => utilisateur.entreprise)
  employe: Utilisateur[];

  @OneToMany(() => Invitation, (invitation) => invitation.entreprise)
  invitations: Invitation[];
}