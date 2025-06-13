import { Module } from '@nestjs/common';
import { GoogleAuthController } from './google-auth.controller';
import { GoogleAuthService } from './google-auth.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Utilisateur } from 'src/auth/auth.entity';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports:[
      PassportModule,
      ConfigModule,
      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          secret: configService.get<string>('JWT_SECRET'), // Assurez-vous que cette clé existe dans votre .env
          signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h' },
        }),
      }),
      TypeOrmModule.forFeature([Utilisateur])
    ],
  controllers: [GoogleAuthController],
  providers: [GoogleAuthService, PassportModule, GoogleStrategy ]
})
export class GoogleAuthModule {}
