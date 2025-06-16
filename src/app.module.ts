import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { TwilioModule } from './twillio/twillio.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { TacheModule } from './tache/tache.module'; 
import { EntrepriseModule } from './entreprise/entreprise.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        parseInputFloatsEnabled: true,
        ssl: { rejectUnauthorized: false },
      }),
      inject: [ConfigService],
    }),
    
    MailerModule,
    TwilioModule,
    AuthModule,
    TacheModule,
    EntrepriseModule,
    
    // Cache avec Redis - Configuration corrigée
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST') || 'localhost',
        port: configService.get<number>('REDIS_PORT') || 6379,
        password: configService.get<string>('REDIS_PASSWORD'), // Si vous avez un mot de passe
        db: configService.get<number>('REDIS_DB') || 0,
        ttl: 0, // Désactiver le TTL global pour gérer manuellement
        // Options Redis supplémentaires
        socket: {
          connectTimeout: 60000,
          lazyConnect: true,
        },
        // Retry configuration
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      }),
      inject: [ConfigService],
      isGlobal: true
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}