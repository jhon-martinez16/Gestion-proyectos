import { IsString, IsOptional } from 'class-validator'

export class GenerarPropuestaDto {
  @IsString()
  nombreCliente: string

  @IsString()
  tipoProyecto: string

  @IsString()
  duracionEstimada: string

  @IsString()
  presupuesto: string

  @IsString()
  objetivos: string

  @IsOptional()
  @IsString()
  contextoAdicional?: string
}
