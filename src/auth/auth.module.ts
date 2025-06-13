import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Utilisateur } from './auth.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt-strategy';
import {NotificationModule} from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Utilisateur]),NotificationModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false  }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:  process.env.JWT_SECRET,
        signOptions: { 
          expiresIn: process.env.JWT_EXPIRES
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [
    AuthModule,
    PassportModule,
    JwtStrategy,
    JwtModule,
    TypeOrmModule.forFeature([Utilisateur,]),
    ]
    
})
export class AuthModule {}
