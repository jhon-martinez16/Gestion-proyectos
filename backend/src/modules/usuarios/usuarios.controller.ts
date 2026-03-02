import {Body,Controller,Get,Param,Patch,Post,UseGuards,} from '@nestjs/common'
import { UsuariosService } from './usuarios.service'
import { CrearUsuarioDto } from './dto/crear-usuario.dto'
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { RolesGuard } from 'src/auth/roles.guard'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { Rol } from '@prisma/client'

@UseGuards(JwtAuthGuard, RolesGuard) // Protege todo el controller
@Controller('usuarios')
export class UsuariosController {
  constructor(private service: UsuariosService) {}

  // SOLO ADMIN puede crear usuarios
  @Roles(Rol.ADMIN)
  @Post()
  crear(@Body() dto: CrearUsuarioDto) {
    return this.service.crear(dto)
  }

  // SOLO ADMIN puede listar usuarios
  @Roles(Rol.ADMIN)
  @Get()
  listar() {
    return this.service.listarActivos()
  }

  // SOLO ADMIN puede ver usuarios
  @Roles(Rol.ADMIN)
  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.service.obtenerPorId(id)
  }

  // SOLO ADMIN puede actualizar
  @Roles(Rol.ADMIN)
  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    return this.service.actualizar(id, dto)
  }

  // SOLO ADMIN puede desactivar
  @Roles(Rol.ADMIN)
  @Patch(':id/desactivar')
  desactivar(@Param('id') id: string) {
    return this.service.desactivar(id)
  }
}