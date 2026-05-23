import { IsString } from 'class-validator'

export class SugerirObjetivosDto {
  @IsString()
  tipoProyecto: string
}
