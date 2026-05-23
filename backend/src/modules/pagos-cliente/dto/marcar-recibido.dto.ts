import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class MarcarRecibidoDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  montoRecibido?: number

  @IsDateString()
  fechaRecibido: string

  @IsOptional()
  @IsString()
  observaciones?: string

  @IsOptional()
  @IsString()
  comprobantePath?: string

  @IsOptional()
  @IsBoolean()
  forzarRecibido?: boolean

  @IsOptional()
  @IsString()
  facturaClienteId?: string
}
