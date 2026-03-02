import { IsString, IsOptional, IsDateString } from 'class-validator'

export class ActualizarEntregableDto {
  @IsString()
  @IsOptional()
  nombre?: string

  @IsString()
  @IsOptional()
  descripcion?: string  

  @IsDateString()
  @IsOptional()
  fechaEntrega?: string
}
