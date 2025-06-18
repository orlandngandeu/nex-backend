import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  UseGuards, 
  Request,
  Get,
  Query,
  Patch,
  Res,
  
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../utils/enums/enums';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';
import { VerifyPhoneDto } from './dto/VerifyPhone.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { UpdatePhoneDto } from './dto/updatePhone.dto';
import { ResendCodeDto } from './dto/resendCodedto';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

@Post('register')
@HttpCode(HttpStatus.CREATED)
@ApiOperation({ summary: 'Inscription classique (Admin par défaut)' })
@ApiBody({
  description: 'Données requises pour l’inscription',
  type: RegisterDto,
  examples: {
    default: {
      summary: 'Exemple d\'inscription',
      value: {
        nom: 'Jean Dupont',
        email: 'jean@example.com',
        telephone: '+237690000000',
        motDePasse: 'P@ssw0rd!'
      }
    }
  }
})
@ApiResponse({
  status: 201,
  description: 'Utilisateur créé avec succès',
  schema: {
    example: {
      id: 'abc123',
      nom: 'Jean Dupont',
      telephone: '+237690000000',
      role: 'ADMIN',
      token: 'eyJhbGciOiJIUzI1NiIsInR...'
    }
  }
})
@ApiResponse({ status: 400, description: 'Données invalides' })
async register(@Body() registerDto: RegisterDto) {
  return this.authService.register(registerDto);
}


  @Post('verify-registration')
  async verifyRegistration(@Body() verifyPhoneDto: VerifyPhoneDto) {
    return this.authService.verifyPhoneAndRegister(verifyPhoneDto);
  }


@Post('login')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Connexion classique' })
@ApiBody({
  type: LoginDto,
  examples: {
    default: {
      summary: 'Connexion avec téléphone et mot de passe',
      value: {
        telephone: '+237690000000',
        motDePasse: 'P@ssw0rd!'
      }
    }
  }
})
@ApiResponse({
  status: 200,
  description: 'Connexion réussie',
  schema: {
    example: {
      user: {
        id: 'abc123',
        nom: 'Jean Dupont',
        telephone: '+237690000000',
        role: 'ADMIN',
      },
      access_token: 'eyJhbGciOiJIUzI1NiIsInR...',
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR...'
    }
  }
})
@ApiResponse({ status: 401, description: 'Identifiants invalides' })
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}


  // Route pour initier la connexion Google (Admin)
  @Get('google/login')
  @ApiOperation({
    summary: 'Initier la connexion Google (Admins)',
    description: 'Redirige vers Google pour l\'authentification des admins'
  })
  @ApiResponse({ status: 302, description: 'Redirection vers Google OAuth' })
  async googleLogin(@Res() res: Response) {
    const authUrl = this.authService.getGoogleAuthUrl();
    return res.redirect(authUrl);
  }

  // Route pour initier la connexion Google (Employés)
  @Get('google/employee-login')
  @ApiOperation({
    summary: 'Initier la connexion Google (Employés)',
    description: 'Redirige vers Google pour l\'authentification des employés'
  })
  @ApiResponse({ status: 302, description: 'Redirection vers Google OAuth' })
  async googleEmployeeLogin(@Res() res: Response) {
    const authUrl = this.authService.getGoogleEmployeeAuthUrl();
    return res.redirect(authUrl);
  }

  // Callback pour les admins
  @Get('google/callback')
  @ApiOperation({
    summary: 'Callback Google OAuth (Admins)',
    description: 'Endpoint appelé par Google après authentification des admins'
  })
  @ApiQuery({ name: 'code', description: 'Code d\'autorisation Google' })
  @ApiQuery({ name: 'state', description: 'État de la requête', required: false })
  @ApiResponse({ status: 200, description: 'Authentification réussie' })
  @ApiResponse({ status: 401, description: 'Authentification échouée' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.authService.googleCallback(code, state);
      
      // Vous pouvez soit retourner le JSON soit rediriger vers votre frontend
      // Option 1: Retourner JSON
      return res.status(HttpStatus.OK).json(result);
      
      // Option 2: Rediriger vers votre frontend avec les tokens
      // const frontendUrl = `${process.env.FRONTEND_URL}/auth/success?token=${result.access_token}&refresh=${result.refresh_token}`;
      // return res.redirect(frontendUrl);
      
    } catch (error) {
      // Rediriger vers une page d'erreur ou retourner l'erreur
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Authentification Google échouée',
        error: error.message
      });
    }
  }

  // Callback pour les employés
  @Get('google/employee/callback')
  @ApiOperation({
    summary: 'Callback Google OAuth (Employés)',
    description: 'Endpoint appelé par Google après authentification des employés'
  })
  @ApiQuery({ name: 'code', description: 'Code d\'autorisation Google' })
  @ApiQuery({ name: 'state', description: 'État de la requête', required: false })
  @ApiResponse({ status: 200, description: 'Authentification réussie' })
  @ApiResponse({ status: 401, description: 'Authentification échouée' })
  async googleEmployeeCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.authService.googleEmployeeCallback(code, state);
      
      // Retourner le résultat ou rediriger
      return res.status(HttpStatus.OK).json(result);
      
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Authentification Google échouée',
        error: error.message
      });
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir le token d\'accès' })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      default: {
        value: {
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR...'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Token rafraîchi',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR...'
      }
    }
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

@Post('forgot-password')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Demande de réinitialisation de mot de passe (Admin uniquement)' })
@ApiBody({
  type: ForgotPasswordDto,
  examples: {
    default: {
      summary: 'Exemple de demande',
      value: {
        telephone: '+237690000000'
      }
    }
  }
})
@ApiResponse({
  status: 200,
  description: 'Code de vérification envoyé',
  schema: {
    example: {
      message: 'Code de vérification envoyé avec succès'
    }
  }
})
@ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
@ApiResponse({ status: 400, description: 'Fonctionnalité réservée aux admins' })
async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
  return this.authService.forgotPassword(forgotPasswordDto);
}

 @Post('reset-password')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Réinitialiser le mot de passe avec le code de vérification' })
@ApiBody({
  type: ResetPasswordDto,
  examples: {
    default: {
      summary: 'Exemple de réinitialisation',
      value: {
        telephone: '+237690000000',
        codeVerification: '123456',
        nouveauMotDePasse: 'NewP@ss1!'
      }
    }
  }
})
@ApiResponse({
  status: 200,
  description: 'Mot de passe réinitialisé avec succès',
  schema: {
    example: {
      message: 'Mot de passe mis à jour avec succès'
    }
  }
})
@ApiResponse({ status: 400, description: 'Code invalide ou expiré' })
async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
  return this.authService.resetPassword(resetPasswordDto);
}


  
  @Post('create-user')
  @Roles( Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Création d\'utilisateur par un admin' })
  @ApiBody({
    type: CreateUserDto,
    examples: {
      default: {
        summary: 'Exemple de création d\'utilisateur',
        value: {
          nom: 'Utilisateur Externe',
          email: 'user@entreprise.com',
          telephone: '+237650000000',
          role: 'EMPLOYE'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé',
    schema: {
      example: {
        id: 'user123',
        nom: 'Utilisateur Externe',
        telephone: '+237650000000',
        role: 'EMPLOYE',
        message: 'Utilisateur créé avec succès'
      }
    }
  })
    async createUser(
    @Body() createUserDto: CreateUserDto,
    @Request() req
  ) {
    return this.authService.createUser(createUserDto, req.user.sub);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déconnexion' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout(@Request() req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = req.user.sub;
    return this.authService.logout(token, userId);
  }

  @Post('update-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Changer le mot de passe connecté' })
  @ApiBody({
    type: UpdatePasswordDto,
    examples: {
      default: {
        value: {
          ancienMotDePasse: 'Ancien@123',
          nouveauMotDePasse: 'Nouveau@456'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe mis à jour',
    schema: {
      example: {
        message: 'Mot de passe mis à jour avec succès'
      }
    }
  })
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Request() req
  ) {
    return this.authService.updatePassword(req.user.sub, updatePasswordDto);
  }

  @Post('update-phone')
  @UseGuards(JwtAuthGuard)
  async updatePhoneNumber(
    @Body() updatePhoneDto: UpdatePhoneDto,
    @Request() req
  ) {
    return this.authService.updatePhoneNumber(req.user.sub, updatePhoneDto);
  }

   @Post('verify-phone-update')
  @UseGuards(JwtAuthGuard)
  async verifyPhoneUpdate(
    @Body() verifyPhoneDto: VerifyPhoneDto,
    @Request() req
  ) {
    return this.authService.verifyAndUpdatePhone(req.user.sub, verifyPhoneDto);
  }

  // Renvoyer le code de vérification
  @Post('resend-code')
@ApiOperation({ summary: 'Renvoyer un code de vérification' })
@ApiBody({
  type: ResendCodeDto,
  examples: {
    default: {
      summary: 'Exemple de renvoi de code',
      value: {
        phone: '+237690000000',
        type: 'registration',
        userId: 'abc123'
      }
    }
  }
})
@ApiResponse({
  status: 200,
  description: 'Code renvoyé',
  schema: {
    example: {
      message: 'Code envoyé à nouveau avec succès'
    }
  }
})
async resendCode(@Body() resendCodeDto: ResendCodeDto) {
  return this.authService.resendVerificationCode(
    resendCodeDto.phone,
    resendCodeDto.type,
    resendCodeDto.userId
  );
}




  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir le profil utilisateur' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  getProfile(@Request() req) {
    return {
      user: req.user,
      message: 'Profil récupéré avec succès'
    };
  }

   // Renvoyer le code de vérification pour la mise à jour du téléphone (version authentifiée)
  @Post('resend-phone-update-code')
  @UseGuards(JwtAuthGuard)
  async resendPhoneUpdateCode(
    @Body() body: { phone: string },
    @Request() req
  ) {
    return this.authService.resendVerificationCode(
      body.phone,
      'phone_update',
      req.user.sub
    );
  }

}