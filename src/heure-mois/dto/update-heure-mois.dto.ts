import { PartialType } from '@nestjs/swagger';
import { CreateHeureMoisDto } from './create-heure-mois.dto';

export class UpdateHeureMoisDto extends PartialType(CreateHeureMoisDto) {}
