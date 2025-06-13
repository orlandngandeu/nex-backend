import { Utilisateur } from 'src/User/entities/utilisateur.entity';
import { StatutConge } from 'src/utils/enums/enums';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class Conge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  motif: string;

  @Column({ type: 'text', nullable: true })
  motifRefus: string | null;

  @Column({
    type: 'enum',
    enum: StatutConge,
    default: StatutConge.EN_ATTENTE,
  })
  statut: StatutConge;

  @Column({ type: 'timestamp' })
  dateDebut: Date;

  @Column({ type: 'timestamp' })
  dateFin: Date;

  @Column({ type: 'integer', nullable: true })
  dureeJours: number;

  @ManyToOne(() => Utilisateur, (utilisateur) => utilisateur.conges, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  utilisateur: Utilisateur;

  @CreateDateColumn({ type: 'timestamp' })
  dateCreation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  update_at: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  delete_at: Date | null;
}
