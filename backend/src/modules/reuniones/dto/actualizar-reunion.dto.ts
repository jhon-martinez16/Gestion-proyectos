import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator'

export class ActualizarReunionDto {
  @IsOptional()
  @IsDateString()
  fecha?: string

  @IsOptional()
  @IsString()
  objetivos?: string

  @IsOptional()
  @IsString()
  proximospasos?: string

  @IsOptional()
  @IsBoolean()
  calidadAprobada?: boolean

  @IsOptional()
  @IsDateString()
  proximaReunion?: string
}
