import { IsOptional, IsString } from 'class-validator'

export class ActualizarCategoriaDto {
  @IsOptional()
  @IsString()
  nombre?: string

  @IsOptional()
  @IsString()
  color?: string
}
