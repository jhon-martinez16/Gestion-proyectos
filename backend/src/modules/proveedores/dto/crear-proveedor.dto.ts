import { IsEmail, IsOptional, IsString } from 'class-validator'

export class CrearProveedorDto {
  @IsString()
  nombre: string

  @IsString()
  nit: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  telefono?: string
}
