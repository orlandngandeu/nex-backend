import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Utilisateur } from '../../auth/auth.entity';
import {StatutTache } from '../../enums/StatutTache';

@Entity()
export class tache {
  @PrimaryGeneratedColumn('uuid')
  idTache: string;

  @Column()
  titre: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'employeAssigneId' })
  employeAssigne: Utilisateur;

  @Column({ type: 'timestamp', nullable: true })
  dateEcheance: Date;

  @Column({ nullable: true })
  priorite: string;

  @CreateDateColumn({ type: 'timestamp' })
  dateCreation: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dureeEnHeures: number;

  @Column({ type: 'boolean', default: false })
  alerteEnvoyee: boolean;

 @Column({ type: 'enum', enum: StatutTache })
type?: StatutTache;

 @Column({ type: 'date' })
  datesupression: Date;

  @BeforeInsert()
  @BeforeUpdate()
  calculerDuree() {
    if (this.dateEcheance && this.dateCreation) {
      const diffMs = new Date(this.dateEcheance).getTime() - new Date(this.dateCreation).getTime();
      this.dureeEnHeures = diffMs / (1000 * 60 * 60); // Conversion en heures
    }
  }
}