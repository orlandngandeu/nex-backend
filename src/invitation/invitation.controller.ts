// src/invitation/invitation.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/enums/role.enums';
import { CreateInvitationDto } from './create-invitation.dto';

@Controller('invitations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post(':id')
  @Roles(Role.Gestionnaire, Role.Administrateur)
  async createInvitation(
    @Body() createInvitationDto: CreateInvitationDto,
    @Param('id') idGestionnaire: string,
  ) {
    // Extraction des propriétés individuelles
    return this.invitationService.createInvitation(
      createInvitationDto.email,
      createInvitationDto.entrepriseId,
      idGestionnaire
    );
  }


  @Post('accept/:token')
  @Roles(Role.Employe)
  async accept(
    @Param('token') token: string,
    @Req() request: Request,
  ) {
    const userId = (request.user as any)?.idUtilisateur;
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.invitationService.acceptInvitation(
      token,
      userId,
    );
  }

  @Get('entreprise/:entrepriseId')
  @Roles(Role.Gestionnaire, Role.Administrateur)
  async getByEntreprise(
    @Param('entrepriseId') entrepriseId: string,
  ) {
    return this.invitationService.getInvitationsByEntreprise(+entrepriseId);
  }
}