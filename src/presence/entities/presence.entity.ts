import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Contrat } from '../../contrat/entities/contrat.entity';
import { Utilisateur } from '../../User/entities/utilisateur.entity';
import { Point } from 'src/utils/types/type';

@Entity()
export class Presence {
  @PrimaryGeneratedColumn()
  idPresence: number;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'utilisateurId' })
  utilisateur: Utilisateur;

  @OneToOne(() => Contrat, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contratId' })
  contrat: Contrat;

  @Column({ type: 'timestamp' })
  heureArrivee: Date;

  @Column({ type: 'timestamp', nullable: true })
  heureDepart: Date;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  localisationArrivee: Point;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  localisationDepart: Point;

  @Column({ nullable: true })
  notes: string;
}
