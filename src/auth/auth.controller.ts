import { BadRequestException, Body, Controller, Delete, Get, Param, Post, UseGuards,Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './Dto/signUp.Dto';
import { LoginDto } from './Dto/login.dto';
import { Utilisateur } from './auth.entity';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')

export class AuthController {
    constructor(
      private  authService: AuthService
    ){}

    @Post('/signup')
    async SignUp(@Body() signUpDto: SignUpDto): Promise<{token: string}> {
      return this.authService.signUp(signUpDto);
    }

    @Get('/login')
    async Login(@Body() loginDto: LoginDto): Promise<{token: string}> {
      return this.authService.login(loginDto);
    }

    @Post('finaliser-inscription')
    async finaliserInscription(
    @Body('code') code: string,
    @Body('motDepasse') motDepasse: string
  ) {
    return this.authService.finaliserInscription(code, motDepasse);
  }

  
  @Post('mot-de-passe-oublie')
  async motDePasseOublie(@Body('email') email: string): Promise<{ message: string }> {
    if (!email) {
      throw new BadRequestException('L\'email est requis.');
    }
    return this.authService.demanderReinitialisationMotDePasse(email);
  }

  
  @Post('reinitialiser-mot-de-passe')
  async reinitialiserMotDePasse(
    @Body('token') token: string,
    @Body('nouveauMotDePasse') nouveauMotDePasse: string
  ): Promise<{ message: string }> {
    if (!token || !nouveauMotDePasse) {
      throw new BadRequestException('Le token et le nouveau mot de passe sont requis.');
    }
    if (nouveauMotDePasse.length < 6) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 6 caractères.');
    }
    return this.authService.reinitialiserMotDePasse(token, nouveauMotDePasse);
  }

   @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', '', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      expires: new Date(0),
      domain: isProd ? process.env.COOKIE_DOMAIN : undefined,
    });
    return { message: 'Déconnecté avec succès' };
  }
 

}

  

    

