import { IsEmail, IsOptional, IsString } from 'class-validator'

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  nombre?: string

  @IsOptional()
  @IsEmail()
  email?: string
}