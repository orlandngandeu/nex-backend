import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Utilisateur } from '../../auth/auth.entity';
import { Contract } from '../../contrat/entities/contrat.entity';

@Entity()
export class commentaire {
  @PrimaryGeneratedColumn('uuid')
  idMessage: string;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'emetteurId' })
  emetteur: Utilisateur;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'destinataireId' })
  destinataire: Utilisateur;

  @ManyToOne(() => Contract, contract => contract.commentaires)
  @JoinColumn({ name: 'contratId' })
  contrat: Contract;

  @Column()
  contenu: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateEnvoi: Date;

  @Column({ nullable: true })
  fichierJoint: string;
}