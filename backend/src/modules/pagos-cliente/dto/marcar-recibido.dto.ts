import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class MarcarRecibidoDto {
  @Type(() => Number)
  montoRecibido: number

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
}
