import { IsEnum, IsOptional, IsString } from 'class-validator'
import { TipoFeedback } from '@prisma/client'

export class CrearFeedbackDto {
  @IsString()
  proyectoId: string

  @IsEnum(TipoFeedback)
  tipo: TipoFeedback

  @IsString()
  descripcion: string

  @IsOptional()
  @IsString()
  accionesTomadas?: string
}
