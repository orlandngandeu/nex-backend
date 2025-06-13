import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../enums/role.enums";
import { Conge } from "src/conge/conge.entity";
import { Entreprise } from "src/entreprise/entreprise.entity";
import { heuremois } from "src/heure-mois/entities/heure-mois.entity";




@Entity()
export class Utilisateur {
    @PrimaryGeneratedColumn('uuid')
    idUtilisateur: string;

    @Column()
    nom: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    motDePasse: string;

    @Column({nullable: true})
    telephone: string ;
    
    @Column({ nullable: true })
    codeInvitation: string;

    @Column({ default: 0 })
    soldeConges: number ;

    @Column({})
    role: Role

    @OneToMany(() => Conge, (conge) => conge.employe)
    conges: Conge[]; // Nom de la propriété qui doit MATCHER avec (employe) => employe.conges

    @ManyToOne(() => Entreprise, (entreprise) => entreprise.employe, { nullable: true })
    entreprise: Entreprise;

    @OneToMany(() => Entreprise, (entreprise) => entreprise.gestionnaire)
    entreprisesGerees: Entreprise[];

    @Column({ nullable: true })
    poste: string;

    @OneToMany(() => heuremois, (heuremois) => heuremois.employesHeure)
    heuremois: heuremois[];

    @Column({ nullable: true })
    tokenReinitialisation: string;

    @Column({ type: 'timestamp', nullable: true })
    expirationTokenReinitialisation: Date;

     @Column({ type: 'date' })
  datesupression: Date;
    
}

