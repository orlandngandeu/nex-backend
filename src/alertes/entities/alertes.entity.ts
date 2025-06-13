import { Contrat } from 'src/contrat/entities/contrat.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Alerte {
  @PrimaryGeneratedColumn('uuid')
  idComment: string;

  @Column({ type: 'text', nullable: false })
  message: string;

  @ManyToOne(() => Contrat, (contrat) => contrat.alerte, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  contract: Contrat;

  @CreateDateColumn({ type: 'timestamp' })
  dateCreation: Date;
}
