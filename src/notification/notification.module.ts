import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';


@Module({
  imports: [], //
  providers: [NotificationService],
  exports: [NotificationService], // 
})
export class NotificationModule {}
