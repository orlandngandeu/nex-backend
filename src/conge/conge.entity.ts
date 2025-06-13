import { Utilisateur } from 'src/auth/auth.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum StatutConge {
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  ANNULE = 'ANNULE',
  EXPIRE = 'EXPIRE'
}

@Entity()
export class Conge {
  
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: StatutConge,
    default: StatutConge.EN_ATTENTE
  })
  statut: StatutConge;

  @Column({ type: 'text' })
  motif: string;

  @Column({ type: 'timestamptz' })
  dateDebut: Date;

  @Column({ type: 'timestamptz' })
  dateFin: Date;

  @Column({ type: 'text', nullable: true })
  motifRefus: string | null;

  @ManyToOne(() => Utilisateur, (employe) => employe.conges, {
    nullable: false,
    onDelete: 'CASCADE' // Supprime les congés si l'employé est supprimé
  },
  )
  employe: Utilisateur ;

  @ManyToOne(() => Utilisateur, { nullable: true })
  gestionnaire: Utilisateur | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'integer', nullable: true })
  dureeJours: number;

   @Column({ type: 'date' })
  datesupression: Date;
}
