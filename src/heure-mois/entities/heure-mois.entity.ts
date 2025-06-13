import { Column, Entity ,ManyToOne, JoinColumn, PrimaryGeneratedColumn, OneToMany} from 'typeorm';
import { Utilisateur } from '../../auth/auth.entity';


@Entity()
export class heuremois {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @ManyToOne(() =>  Utilisateur, (employesHeure) => employesHeure.heuremois )
  employesHeure: Utilisateur;

  @Column({ type: 'integer', nullable: true })
  mois: number;

  @Column({ type: 'integer', nullable: true })
  annee: number;

  @Column({ type: 'float', nullable: true })
  heuresMensuelles: number;
}
