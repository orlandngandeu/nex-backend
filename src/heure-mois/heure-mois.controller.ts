import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HeureMoisService } from './heure-mois.service';
import { CreateHeureMoisDto } from './dto/create-heure-mois.dto';
import { UpdateHeureMoisDto } from './dto/update-heure-mois.dto';

@Controller('heure-mois')
export class HeureMoisController {
  constructor(private readonly heureMoisService: HeureMoisService) {}

  @Post()
  create(@Body() createHeureMoisDto: CreateHeureMoisDto) {
    return this.heureMoisService.create(createHeureMoisDto);
  }

  @Get()
  findAll() {
    return this.heureMoisService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.heureMoisService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHeureMoisDto: UpdateHeureMoisDto) {
    return this.heureMoisService.update(+id, updateHeureMoisDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.heureMoisService.remove(+id);
  }
}
