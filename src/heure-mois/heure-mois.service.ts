import { Injectable } from '@nestjs/common';
import { CreateHeureMoisDto } from './dto/create-heure-mois.dto';
import { UpdateHeureMoisDto } from './dto/update-heure-mois.dto';

@Injectable()
export class HeureMoisService {
  create(createHeureMoisDto: CreateHeureMoisDto) {
    return 'This action adds a new heureMois';
  }

  findAll() {
    return `This action returns all heureMois`;
  }

  findOne(id: number) {
    return `This action returns a #${id} heureMois`;
  }

  update(id: number, updateHeureMoisDto: UpdateHeureMoisDto) {
    return `This action updates a #${id} heureMois`;
  }

  remove(id: number) {
    return `This action removes a #${id} heureMois`;
  }
}
