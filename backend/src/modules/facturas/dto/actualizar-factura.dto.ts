import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { EstadoFactura } from '@prisma/client'

export class ActualizarFacturaDto {
  @IsOptional()
  @IsString()
  numero?: string

  @IsOptional()
  @IsString()
  concepto?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto?: number

  @IsOptional()
  @IsEnum(EstadoFactura)
  estado?: EstadoFactura

  @IsOptional()
  @IsDateString()
  fechaEmision?: string

  @IsOptional()
  @IsDateString()
  fechaPago?: string

  @IsOptional()
  @IsString()
  observaciones?: string

  @IsOptional()
  @IsString()
  comprobantePagoPath?: string
}

export class ProgramarPagoDto {
  @IsDateString()
  fechaProgramadaPago: string
}

export class EjecutarPagoDto {
  @IsOptional()
  @IsString()
  comprobantePagoPath?: string
}

export class ConfirmarPagoDto {
  @IsBoolean()
  confirmacionFinanciera: boolean
}
