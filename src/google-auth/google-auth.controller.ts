import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthService } from './google-auth.service';
import { Request, Response } from 'express';

@Controller('google-auth')
export class GoogleAuthController {
    constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {
    // Initiates the Google OAuth 2.0 flow
  }

  @Get('callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const googleUser = req.user;
    if (googleUser) {
      const user = await this.googleAuthService.findOrCreateGoogleUser(googleUser);
      const jwt = await this.googleAuthService.generateJwt(user);
      // Rediriger l'utilisateur avec le JWT (par exemple, via query parameter ou cookie)
      return res.redirect(`/login/success?token=${jwt.token}`);
    } else {
      return res.redirect('/login/failure');
    }
  }

  @Get('login/success')
  loginSuccess(@Req() req: Request) {
    if (req.query.token) {
      return { message: 'Google login successful', token: req.query.token };
    } else {
      return { message: 'Google login successful, but no token provided' };
    }
  }

  @Get('login/failure')
  loginFailure() {
    return { message: 'Google login failed' };
  }
}
