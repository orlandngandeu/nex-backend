import { PartialType } from '@nestjs/swagger';
import { CreateTwillioDto } from './create-twillio.dto';

export class UpdateTwillioDto extends PartialType(CreateTwillioDto) {}
