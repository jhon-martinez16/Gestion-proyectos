import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator'

export enum DecisionCompromiso {
  CUMPLIDO = 'CUMPLIDO',
  NO_CUMPLIDO = 'NO_CUMPLIDO',
  REPROGRAMAR = 'REPROGRAMAR',
}

export class ResolverCompromisoDto {
  @IsEnum(DecisionCompromiso)
  decision: DecisionCompromiso

  @IsOptional()
  @IsString()
  comentario?: string

  @IsOptional()
  @IsDateString()
  nuevaFecha?: string

  @IsOptional()
  @IsString()
  nuevaDescripcion?: string
}
