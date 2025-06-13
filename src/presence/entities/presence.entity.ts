import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Contract } from '../../contrat/entities/contrat.entity';
import { Utilisateur } from '../../auth/auth.entity';

@Entity()
export class Presence {
  @PrimaryGeneratedColumn('uuid')
  idPresence: string;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'utilisateurId' })
  utilisateur: Utilisateur;

  @ManyToOne(() => Contract, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contratId' })
  contrat: Contract;

  @Column({ type: 'timestamp' })
  heureArrivee: Date;

  @Column({ type: 'timestamp', nullable: true })
  heureDepart: Date;

  @Column('float', { array: true, nullable: true })
  localisationArrivee: number[];

  @Column('float', { array: true, nullable: true })
  localisationDepart: number[];
  
  @Column({ nullable: true })
  remarques: string;

   @Column({ type: 'date' })
  datesupression: Date;
}