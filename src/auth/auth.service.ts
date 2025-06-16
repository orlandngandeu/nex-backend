import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../User/user.service';
import { TwilioService } from '../twillio/twillio.service';
import { CacheService } from '../cache/cache.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../utils/enums/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private twilioService: TwilioService,
    private cacheService: CacheService
  ) {}

  async register(registerDto: RegisterDto) {
    const createUserDto: CreateUserDto = {
      ...registerDto,
      role: Role.ADMIN // Par défaut ADMIN pour l'enregistrement
    };

    const user = await this.usersService.create(createUserDto);
    const { motDePasse, ...userWithoutPassword } = user;

    const payload = { sub: user.idUtilisateur, phone: user.telephone, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      user: userWithoutPassword,
      access_token: token
    };
  }

  async login(loginDto: LoginDto) {
    const { telephone, motDePasse } = loginDto;
    
    const user = await this.usersService.findByPhone(telephone);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (!user.isActif) {
      throw new UnauthorizedException('Compte désactivé');
    }

    const isPasswordValid = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const { motDePasse: _, ...userWithoutPassword } = user;
    const payload = { sub: user.idUtilisateur, phone: user.telephone, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      user: userWithoutPassword,
      access_token: token
    };
  }

async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
  const { telephone } = forgotPasswordDto;
  
  const user = await this.usersService.findByPhone(telephone);
  if (!user) {
    throw new NotFoundException('Utilisateur non trouvé');
  }
  
  // Vérifier si c'est un ADMIN
  if (user.role !== Role.ADMIN) {
    throw new BadRequestException('Cette fonctionnalité est réservée aux administrateurs');
  }
  
  // Générer code de vérification
  const verificationCode = this.twilioService.generateVerificationCode();
  console.log(`Code généré pour ${telephone}: ${verificationCode}`);
  
  // Stocker dans le cache (expire en 10 minutes = 600 secondes)
  const cacheKey = `reset_password_${telephone}`;
  const ttlSeconds = 600; // 10 minutes
  
  try {
    await this.cacheService.set(cacheKey, verificationCode, ttlSeconds);
    console.log(`Code stocké dans le cache avec la clé: ${cacheKey}`);
    
    // Vérifier immédiatement que le code est bien stocké
    const storedCode = await this.cacheService.get(cacheKey);
    console.log(`Code récupéré immédiatement: ${storedCode}`);
    
    if (!storedCode) {
      throw new Error('Erreur lors du stockage du code dans le cache');
    }
    
  } catch (error) {
    console.error('Erreur cache:', error);
    throw new BadRequestException('Erreur lors de la génération du code');
  }
  
  // Envoyer SMS
  const message = `Votre code de réinitialisation: ${verificationCode}. Ce code expire dans 10 minutes.`;
  
  try {
    await this.twilioService.sendSMS(telephone, message);
    console.log(`SMS envoyé à ${telephone}`);
  } catch (error) {
    console.error('Erreur SMS:', error);
    // Supprimer le code du cache si l'envoi SMS échoue
    await this.cacheService.del(cacheKey);
    throw new BadRequestException('Erreur lors de l\'envoi du SMS');
  }
  
  return { 
    message: 'Code de vérification envoyé par SMS',
    debug: {
      codeGenerated: verificationCode,
      cacheKey: cacheKey,
      ttl: ttlSeconds
    }
  };
}

async resetPassword(resetPasswordDto: ResetPasswordDto) {
  const { telephone, codeVerification, nouveauMotDePasse } = resetPasswordDto;
  
  const cacheKey = `reset_password_${telephone}`;
  
  // Debug: vérifier l'existence de la clé
  console.log(`Tentative de récupération du code pour: ${cacheKey}`);
  
  // Vérifier le code de vérification
  const storedCode = await this.cacheService.get(cacheKey);
  console.log(`Code stocké: ${storedCode}, Code fourni: ${codeVerification}`);
  
  if (!storedCode) {
    console.log('Aucun code trouvé dans le cache');
    throw new BadRequestException('Code de vérification expiré ou inexistant');
  }
  
  if (storedCode !== codeVerification) {
    console.log('Code de vérification incorrect');
    throw new BadRequestException('Code de vérification invalide');
  }
  
  const user = await this.usersService.findByPhone(telephone);
  if (!user) {
    throw new NotFoundException('Utilisateur non trouvé');
  }
  
  try {
    // Mettre à jour le mot de passe
    await this.usersService.updatePassword(user.idUtilisateur, nouveauMotDePasse);
    
    // Supprimer le code du cache
    await this.cacheService.del(cacheKey);
    console.log(`Code supprimé du cache: ${cacheKey}`);
    
    return { message: 'Mot de passe réinitialisé avec succès' };
    
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    throw new BadRequestException('Erreur lors de la réinitialisation du mot de passe');
  }
}

  async createUser(createUserDto: CreateUserDto, adminId: string) {
    // Vérifier que l'admin existe et est actif
    const admin = await this.usersService.findById(adminId);
    if (admin.role !== Role.ADMIN) {
      throw new UnauthorizedException('Seuls les administrateurs peuvent créer des utilisateurs');
    }

    const user = await this.usersService.create(createUserDto);
    const { motDePasse, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async logout(token: string) {
    // Ajouter le token à la blacklist (optionnel)
    const decoded = this.jwtService.decode(token);
    if (decoded && typeof decoded === 'object' && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      await this.cacheService.set(`blacklist_${token}`, true, ttl);
    }

    return { message: 'Déconnexion réussie' };
  }
}