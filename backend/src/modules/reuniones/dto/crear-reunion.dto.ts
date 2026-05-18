import { IsDateString, IsOptional, IsString, IsNotEmpty } from 'class-validator'

export class CrearReunionDto {
  @IsDateString()
  fecha: string

  @IsString()
  @IsNotEmpty()
  objetivos: string

  @IsOptional()
  @IsString()
  proximospasos?: string

  @IsOptional()
  @IsDateString()
  proximaReunion?: string

  @IsString()
  @IsNotEmpty()
  proyectoId: string
}
