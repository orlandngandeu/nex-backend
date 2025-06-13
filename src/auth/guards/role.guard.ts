import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../../enums/role.enums";
import { ROLE_KEY } from "../decorators/role.decorator";



@Injectable()
export class RolesGuard implements CanActivate{
    constructor(private reflector: Reflector){}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<Role[]>(ROLE_KEY, context.getHandler());
        if (!requiredRoles) return true;
      /* *const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLE_KEY, [
            context.getHandler(),
            context.getClass()
        ]);*/

        console.log("requiredRoles: ", requiredRoles)

        if(!requiredRoles){
            return true;
        }

       

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        console.log("user?.role", user?.role)
        console.log('User from token:', user);
        console.log('Required roles:', requiredRoles);
        console.log('User has role?', requiredRoles.includes(user.role));

        return matchRoles(requiredRoles, user?.role)
    }
}

function matchRoles(requiredRoles: string[], userRole: string){
    // roles.guard.ts
   //return requiredRoles.some(role => role.toLowerCase() === userRole?.toLowerCase());
   return requiredRoles.some((role: string) => userRole?.includes(role))
}