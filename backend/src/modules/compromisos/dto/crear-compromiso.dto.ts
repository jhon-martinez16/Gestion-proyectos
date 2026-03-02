import { IsString, IsDateString, IsUUID, IsOptional } from 'class-validator'

export class CrearCompromisoDto {
  @IsString()
  descripcion: string

  @IsDateString()
  fecha: string

  @IsUUID()
  proyectoId: string

  @IsUUID()
  @IsOptional()
  responsableId?: string
}
