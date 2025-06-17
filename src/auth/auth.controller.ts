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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
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
  ApiBody
} from '@nestjs/swagger';
import { VerifyPhoneDto } from './dto/VerifyPhone.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { UpdatePhoneDto } from './dto/updatePhone.dto';
import { ResendCodeDto } from './dto/resendCodedto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inscription classique (Admin par défaut)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
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
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Connexion/Inscription Google (Admins)',
    description: 'Connexion Google pour les admins. Crée automatiquement un compte admin si inexistant.'
  })
  @ApiResponse({ status: 200, description: 'Connexion Google réussie' })
  @ApiResponse({ status: 401, description: 'Token Google invalide' })
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
  }

  @Post('google/employee-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Connexion Google pour employés/managers',
    description: 'Connexion Google pour les employés et managers créés en backoffice. Le compte doit exister.'
  })
  @ApiResponse({ status: 200, description: 'Connexion Google employé réussie' })
  @ApiResponse({ status: 401, description: 'Compte non trouvé ou non autorisé' })
  async googleEmployeeLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLoginEmployee(googleLoginDto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renouveler le token d\'accès' })
  @ApiResponse({ status: 200, description: 'Token renouvelé avec succès' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demande de réinitialisation de mot de passe (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Code de vérification envoyé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 400, description: 'Fonctionnalité réservée aux admins' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec le code de vérification' })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé avec succès' })
  @ApiResponse({ status: 400, description: 'Code invalide ou expiré' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('create-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un utilisateur (Admin uniquement)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin requis' })
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

   @Patch('update-password')
  @UseGuards(JwtAuthGuard)
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