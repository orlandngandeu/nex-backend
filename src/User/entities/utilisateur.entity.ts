import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../utils/enums/enums';
import { Conge } from 'src/conge/entities/conge.entity';
import { UtilisateurEntreprise } from 'src/UtilisateurEntreprise/entities/utilisateur-entreprise.entity';

@Entity()
export class Utilisateur {
  @PrimaryGeneratedColumn('uuid')
  idUtilisateur: string;

  @Column()
  nom: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ unique: true, nullable: false })
  telephone: string;

  @Column({ nullable: true })
  motDePasse: string;

  @Column({
    type: 'enum',
    enum: Role,
  })
  role: Role;

  @Column({ default: true })
  isActif: boolean;

  @OneToMany(() => UtilisateurEntreprise, (ue) => ue.utilisateur)
  entreprises!: UtilisateurEntreprise[];

  @OneToMany(() => Conge, (conge) => conge.utilisateur)
  conges: Conge[];

  @CreateDateColumn({ type: 'timestamp' })
  dateCreation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  update_at: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  delete_at: Date | null;
}
