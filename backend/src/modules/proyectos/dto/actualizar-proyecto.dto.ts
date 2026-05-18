import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator'
import { EstadoProyecto, EtapaProyecto } from '@prisma/client'

export class ActualizarProyectoDto {
  @IsOptional()
  @IsString()
  nombre?: string

  @IsOptional()
  @IsString()
  descripcion?: string

  @IsOptional()
  @IsDateString()
  fechaFin?: string

  @IsOptional()
  @IsEnum(EtapaProyecto)
  etapa?: EtapaProyecto

  @IsOptional()
  @IsBoolean()
  contratoFirmado?: boolean

  @IsOptional()
  @IsBoolean()
  kickoffRealizado?: boolean

  @IsOptional()
  @IsDateString()
  kickoffFecha?: string

  @IsOptional()
  @IsEnum(EstadoProyecto)
  estado?: EstadoProyecto

  @IsOptional()
  @IsBoolean()
  propuestaAprobada?: boolean

  @IsOptional()
  @IsBoolean()
  requierePoliza?: boolean

  @IsOptional()
  @IsBoolean()
  requiereContrato?: boolean

  @IsOptional()
  @IsBoolean()
  polizaContratada?: boolean
}
