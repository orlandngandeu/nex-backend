// src/auth/strategies/google.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    try {
      const { id, emails, name, photos } = profile;
  
      const user = {
        googleId: id, // Mappe à une propriété pour l'identifiant Google dans la BD 
        nom: name ? name.familyName : null, // Mappe à la propriété 'nom' de la BD 
        prenom: name ? name.givenName : null, //  vouloir mapper le prénom séparément
        email: emails ? emails[0].value : null, // Mappe à la propriété 'email' de la BD
        telephone: null, // Le téléphone n'est généralement pas directement disponible,
        picture: photos ? photos[0].value : null, // si besoin mapper la photo de profil
        accessToken,
      };
  
      console.log('User object in validate:', user); // Debugging log
      done(null, user); // Important: call done with null for no error and the user object
  
    } catch (error) {
      console.error('Error in GoogleStrategy validate:', error);
      done(error as Error, undefined); // Call done with the error
    }
  }
}