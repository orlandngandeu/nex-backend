// src/invitation/entities/invitation.entity.ts
import { Utilisateur } from 'src/auth/auth.entity';
import { Entreprise } from 'src/entreprise/entreprise.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity()
export class Invitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column()
  token: string;

  @Column()
  expiresAt: Date;

  @ManyToOne(() => Entreprise, (entreprise) => entreprise.invitations)
  entreprise: Entreprise;

  @ManyToOne(() => Utilisateur, { nullable: true })
  createdBy: Utilisateur;

  @ManyToOne(() => Utilisateur, { nullable: true })
  utilisateur: Utilisateur; // Rempli quand l'invitation est acceptée
}