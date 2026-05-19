import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { UsuariosService } from './usuarios.service'
import { CrearUsuarioDto } from './dto/crear-usuario.dto'
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { RolesGuard } from '../../auth/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { Rol } from '@prisma/client'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private service: UsuariosService) {}

  @Roles(Rol.ADMIN)
  @Post()
  crear(@Body() dto: CrearUsuarioDto) {
    return this.service.crear(dto)
  }

  @Roles(Rol.ADMIN)
  @Get()
  listar() {
    return this.service.listarActivos()
  }

  @Get('asignables')
  asignables() {
    return this.service.listarParaAsignar()
  }

  // Any authenticated user can read their own profile; ADMIN can read any
  @Get(':id')
  obtener(@Param('id') id: string, @Req() req: any) {
    if (req.user.rol !== Rol.ADMIN && req.user.sub !== id) {
      throw new ForbiddenException('No tienes permisos para ver este usuario')
    }
    return this.service.obtenerPorId(id)
  }

  // Any authenticated user can update their own profile; ADMIN can update any
  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarUsuarioDto, @Req() req: any) {
    if (req.user.rol !== Rol.ADMIN && req.user.sub !== id) {
      throw new ForbiddenException('No tienes permisos para actualizar este usuario')
    }
    return this.service.actualizar(id, dto)
  }

  @Roles(Rol.ADMIN)
  @Patch(':id/desactivar')
  desactivar(@Param('id') id: string) {
    return this.service.desactivar(id)
  }
}
