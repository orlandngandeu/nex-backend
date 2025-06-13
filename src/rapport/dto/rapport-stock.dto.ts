import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';


export class RechercheStockDto {
    @IsOptional()
    @IsString()
    nom?: string;
  
    @IsOptional()
    @IsString()
    codeBarres?: string;
  
    @IsOptional()
    @IsString()
    reference?: string;
  }
  
  export class FiltreStockDto {
    @IsOptional()
    @IsString()
    etatStock?: 'disponible' | 'rupture' | 'commande';
  
    @IsOptional()
    @IsDateString()
    dateDebut?: string;
  
    @IsOptional()
    @IsDateString()
    dateFin?: string;
  }