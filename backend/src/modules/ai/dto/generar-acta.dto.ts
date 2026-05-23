import { IsString, IsObject } from 'class-validator'

export class GenerarActaDto {
  @IsString()
  resumenInformal: string

  @IsObject()
  contextoProyecto: Record<string, unknown>
}
