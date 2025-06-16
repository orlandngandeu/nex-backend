import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EntrepriseService } from './entreprise.service';
import { CreateEntrepriseDto } from './dto/create-entreprise.dto';
import { UpdateEntrepriseDto } from './dto/update-entreprise.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../utils/enums/enums';
import { Response } from 'express';

@Controller('entreprises')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EntrepriseController {
  constructor(private readonly entrepriseService: EntrepriseService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(
    @Body() createEntrepriseDto: CreateEntrepriseDto,
    @Request() req: any,
  ) {
    return this.entrepriseService.create(createEntrepriseDto, req.user.idUtilisateur);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.entrepriseService.findAll(paginationDto);
  }

  @Get('deleted')
  @Roles(Role.ADMIN)
  async findAllDeleted(@Query() paginationDto: PaginationDto) {
    return this.entrepriseService.findAllDeleted(paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.entrepriseService.findOne(id);
  }

  @Get(':id/users')
  async getUsersByEntreprise(
    @Param('id') id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.entrepriseService.getUsersByEntreprise(id, paginationDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEntrepriseDto: UpdateEntrepriseDto,
    @Request() req: any,
  ) {
    return this.entrepriseService.update(id, updateEntrepriseDto, req.user.idUtilisateur);
  }

  @Post(':id/invite')
  async inviteUser(
    @Param('id') id: string,
    @Body() inviteUserDto: InviteUserDto,
    @Request() req: any,
  ) {
    return this.entrepriseService.inviteUser(id, inviteUserDto, req.user.idUtilisateur);
  }

  @Post(':id/transfer-ownership')
  async transferOwnership(
    @Param('id') id: string,
    @Body() transferOwnershipDto: TransferOwnershipDto,
    @Request() req: any,
  ) {
    return this.entrepriseService.transferOwnership(
      id,
      transferOwnershipDto,
      req.user.idUtilisateur,
    );
  }

  @Get(':id/export/csv')
  async exportToCSV(@Param('id') id: string, @Res() res: Response) {
    const csvData = await this.entrepriseService.exportToCSV(id);
    res.header('Content-Type', 'text/csv');
    res.attachment(`entreprise-${id}-data.csv`);
    return res.send(csvData);
  }

  @Get(':id/export/pdf')
  async exportToPDF(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.entrepriseService.exportToPDF(id);
    res.header('Content-Type', 'application/pdf');
    res.attachment(`entreprise-${id}-data.pdf`);
    return res.send(pdfBuffer);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.entrepriseService.remove(id, req.user.idUtilisateur);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  async restore(@Param('id') id: string) {
    return this.entrepriseService.restore(id);
  }
}