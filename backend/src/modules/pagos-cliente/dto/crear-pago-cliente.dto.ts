import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CrearPagoClienteDto {
  @IsString()
  proyectoId: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  numeroCuota: number

  @IsString()
  descripcion: string

  @Type(() => Number)
  montoEsperado: number

  @IsDateString()
  fechaEsperada: string

  @IsOptional()
  @IsString()
  observaciones?: string
}
