import { Injectable, type CanActivate, type ExecutionContext, UnauthorizedException } from "@nestjs/common"
import type { Request } from "express"
import { auth } from "./auth.config"

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    try {
      // Convertir les headers Express en Headers Web API
      const headers = new Headers()
      Object.entries(request.headers).forEach(([key, value]) => {
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
        throw new UnauthorizedException("Session non trouvée")
      }
      // Ajouter les informations de session à la requête
      ;(request as any).user = session.user
      ;(request as any).session = session

      return true
    } catch (error) {
      throw new UnauthorizedException("Token invalide ou expiré")
    }
  }
}
