import { IsString, IsNotEmpty, IsDateString } from 'class-validator'

export class CrearProyectoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsString()
  descripcion: string

  @IsDateString()
  fechaInicio: string

  @IsDateString()
  fechaFin: string

  @IsString()
  categoriaId: string

  @IsString()
  liderId: string

  @IsString()
  socio2Id: string
}
