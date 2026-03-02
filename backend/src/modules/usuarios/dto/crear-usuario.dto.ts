import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator'
import { Rol } from '@prisma/client'

export class CrearUsuarioDto {
  @IsString()
  nombre: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string

  @IsEnum(Rol)
  rol: Rol
}