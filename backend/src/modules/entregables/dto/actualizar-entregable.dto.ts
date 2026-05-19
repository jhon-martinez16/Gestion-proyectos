import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator'
import { EstadoEntregable } from '@prisma/client'

export class ActualizarEntregableDto {
  @IsOptional()
  @IsString()
  nombre?: string

  @IsOptional()
  @IsString()
  descripcion?: string

  @IsOptional()
  @IsDateString()
  fechaEntrega?: string

  @IsOptional()
  @IsBoolean()
  revisionInternaAprobada?: boolean

  @IsOptional()
  @IsBoolean()
  clienteAprobado?: boolean

  @IsOptional()
  @IsString()
  observacionesCliente?: string

  @IsOptional()
  @IsDateString()
  fechaAprobacionCliente?: string

  @IsOptional()
  @IsEnum(EstadoEntregable)
  estado?: EstadoEntregable

  @IsOptional()
  @IsString()
  motivoReprogramacion?: string
}
