import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CrearFacturaDto {
  @IsString()
  proyectoId: string

  @IsString()
  numero: string

  @IsString()
  concepto: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto: number

  @IsDateString()
  fechaEmision: string

  @IsOptional()
  @IsString()
  observaciones?: string

  @IsOptional()
  @IsString()
  proveedorId?: string
}
