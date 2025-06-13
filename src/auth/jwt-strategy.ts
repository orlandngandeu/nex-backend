import { PassportStrategy, PassportModule } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Utilisateur } from './auth.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Utilisateur)
    private authRepository : Repository<Utilisateur>,
    private configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET')

    });
  }

  async validate(payload) {
    const { id } = payload;
   // return { id: payload.sub, email: payload.email };
   try {
      const utilisateur = await this.authRepository.findOneBy({ idUtilisateur: id });

      if (!utilisateur) {
        throw new UnauthorizedException('Accès non autorisé. Token invalide ou utilisateur inexistant.');
      }

      return utilisateur;

    } catch (error) {
      console.error('Erreur lors de la validation du token:', error);
      throw new InternalServerErrorException('Erreur interne lors de la validation du token.');
    }
  }
}
