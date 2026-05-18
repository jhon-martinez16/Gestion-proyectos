import { IsString } from 'class-validator'

export class CrearVersionDto {
  @IsString()
  descripcionCambios: string
}
