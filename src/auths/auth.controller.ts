import { Controller, Get, Post, UseGuards, HttpStatus, BadRequestException } from "@nestjs/common"
import type { Request, Response } from "express"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import type { AuthService } from "./auth.service"
import { auth } from "./auth.config"
import { AuthGuard } from "./auth.guard"

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("google")
  @ApiOperation({ summary: "Initier la connexion Google OAuth" })
  @ApiResponse({ status: 302, description: "Redirection vers Google OAuth" })
  async googleAuth(req: Request, res: Response) {
    try {
      // Construire l'URL de redirection Google OAuth manuellement
      const googleAuthUrl = new URL("https://accounts.google.com/oauth/authorize")
      googleAuthUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!)
      googleAuthUrl.searchParams.set("redirect_uri", `${process.env.BASE_URL}/auth/google/callback`)
      googleAuthUrl.searchParams.set("response_type", "code")
      googleAuthUrl.searchParams.set("scope", "openid email profile")
      googleAuthUrl.searchParams.set("state", "google-oauth")

      return res.redirect(googleAuthUrl.toString())
    } catch (error) {
      throw new BadRequestException("Erreur lors de l'initialisation OAuth")
    }
  }

@Get("google/callback")
@ApiOperation({ summary: "Callback Google OAuth" })
@ApiResponse({ status: 200, description: "Authentification réussie" })
@ApiResponse({ status: 400, description: "Erreur d'authentification" })
async googleCallback(req: Request, res: Response) {
  try {
    // Better Auth gère automatiquement le callback OAuth
    // Il suffit de rediriger vers l'endpoint Better Auth
    const { code, state, error } = req.query

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`)
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_code`)
    }

    // Construire l'URL de callback Better Auth
    const callbackUrl = new URL('/api/auth/callback/google', process.env.BASE_URL)
    callbackUrl.searchParams.set('code', code as string)
    if (state) {
      callbackUrl.searchParams.set('state', state as string)
    }

    // Rediriger vers Better Auth pour qu'il gère l'authentification
    return res.redirect(callbackUrl.toString())

  } catch (error) {
    console.error("Erreur callback Google:", error)
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`)
  }
}

  @Post("logout")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Déconnexion" })
  @ApiResponse({ status: 200, description: "Déconnexion réussie" })
  async logout(req: Request, res: Response) {
    try {
      // Convertir les headers Express en Headers Web API
      const headers = new Headers()
      Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          headers.set(key, value)
        } else if (Array.isArray(value)) {
          headers.set(key, value.join(", "))
        }
      })

      await auth.api.signOut({
        headers,
      })

      res.clearCookie("better-auth.session_token")

      return res.status(HttpStatus.OK).json({
        message: "Déconnexion réussie",
      })
    } catch (error) {
      throw new BadRequestException("Erreur lors de la déconnexion")
    }
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtenir les informations de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: "Informations utilisateur" })
  @ApiResponse({ status: 401, description: "Non authentifié" })
  async getMe(req: Request) {
    // Convertir les headers Express en Headers Web API
    const headers = new Headers()
    Object.entries(req.headers).forEach(([key, value]) => {
      if (typeof value === "string") {
        headers.set(key, value)
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(", "))
      }
    })

    const session = await auth.api.getSession({
      headers,
    })

    if (!session) {
      throw new BadRequestException("Session non trouvée")
    }

    const utilisateur = await this.authService.findUserByEmail(session.user.email)

    return {
      user: {
        id: utilisateur?.idUtilisateur,
        email: utilisateur?.email,
        nom: utilisateur?.nom,
        role: utilisateur?.role,
        entreprise: utilisateur?.entreprise,
        telephone: utilisateur?.telephone,
        poste: utilisateur?.poste,
        soldeConges: utilisateur?.soldeConges,
        salairePerheure: utilisateur?.salairePerheure,
      },
      session: session,
    }
  }

  @Get("session")
  @ApiOperation({ summary: "Vérifier la session" })
  @ApiResponse({ status: 200, description: "Session valide" })
  @ApiResponse({ status: 401, description: "Session invalide" })
  async checkSession(req: Request) {
    try {
      // Convertir les headers Express en Headers Web API
      const headers = new Headers()
      Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          headers.set(key, value)
        } else if (Array.isArray(value)) {
          headers.set(key, value.join(", "))
        }
      })

      const session = await auth.api.getSession({
        headers,
      })

      if (session) {
        const utilisateur = await this.authService.findUserByEmail(session.user.email)
        return {
          authenticated: true,
          user: {
            id: utilisateur?.idUtilisateur,
            email: utilisateur?.email,
            nom: utilisateur?.nom,
            role: utilisateur?.role,
          },
        }
      }

      return {
        authenticated: false,
        user: null,
      }
    } catch (error) {
      return {
        authenticated: false,
        user: null,
      }
    }
  }
}
