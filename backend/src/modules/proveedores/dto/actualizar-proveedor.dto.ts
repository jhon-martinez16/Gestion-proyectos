import { IsEmail, IsOptional, IsString } from 'class-validator'

export class ActualizarProveedorDto {
  @IsOptional()
  @IsString()
  nombre?: string

  @IsOptional()
  @IsString()
  nit?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  telefono?: string
}
