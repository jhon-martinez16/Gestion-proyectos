import { IsString, IsOptional, IsDateString } from 'class-validator'

export class ActualizarProyectoDto {
  @IsString()
  @IsOptional()
  nombre?: string

  @IsString()
  @IsOptional()
  descripcion?: string

  @IsDateString()
  @IsOptional()
  fechaFin?: string
}
