import { IsString, IsNotEmpty, IsDateString } from 'class-validator'

export class CrearEntregableDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsString()
  @IsNotEmpty()
  descripcion: string   

  @IsDateString()
  fechaEntrega: string

  @IsString()
  proyectoId: string
}
