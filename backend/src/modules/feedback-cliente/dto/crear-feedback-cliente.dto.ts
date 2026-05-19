import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class CrearFeedbackClienteDto {
  @IsString()
  proyectoId: string

  @IsOptional()
  @IsString()
  entregableId?: string

  @IsInt()
  @Min(1)
  @Max(5)
  calificacion: number

  @IsString()
  comentario: string

  @IsDateString()
  fechaFeedback: string
}
