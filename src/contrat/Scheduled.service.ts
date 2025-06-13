import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './entities/contrat.entity';
import { NotificationService } from '../notification/notification.service';
import { Between } from 'typeorm';


@Injectable()
export class ScheduledNotificationService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    private notificationService: NotificationService,
  ) {}

  // Exécute tous les jours à 7h du matin
  @Cron('0 7 * * *', {
    timeZone: 'Africa/Douala', // Ajustez selon votre timezone
  })
  async sendDailyContractNotifications() {
    console.log('Vérification des contrats du jour pour les notifications...');
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    try {
      // Trouver tous les contrats qui commencent aujourd'hui
      const todayContracts = await this.contractRepository.find({
        where: {
         horaireDebut: Between(startOfDay, endOfDay),
         estTermine: false,
        },
        relations: ['utilisateur'],
      });

      console.log(`${todayContracts.length} contrat(s) trouvé(s) pour aujourd'hui`);

      for (const contract of todayContracts) {
        if (contract.utilisateur) {
          try {
            await this.notificationService.sendContractNotification(
              contract.utilisateur, 
              contract
            );
            console.log(`Notification quotidienne envoyée pour le contrat ${contract.idContrat}`);
          } catch (error) {
            console.error(`Erreur envoi notification pour contrat ${contract.idContrat}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des contrats quotidiens:', error);
    }
  }
}