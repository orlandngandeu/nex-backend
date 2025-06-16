import { PartialType } from '@nestjs/mapped-types';
import { CreateEntrepriseDto } from './create-entreprise.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdateEntrepriseDto extends PartialType(
  OmitType(CreateEntrepriseDto, ['managerId'] as const)
) {}