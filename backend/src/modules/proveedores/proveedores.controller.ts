import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ProveedoresService } from './proveedores.service'
import { CrearProveedorDto } from './dto/crear-proveedor.dto'
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { RolesGuard } from 'src/auth/roles.guard'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { Rol } from '@prisma/client'

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN, Rol.ADMINISTRATIVO)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly service: ProveedoresService) {}

  @Post()
  crear(@Body() dto: CrearProveedorDto) {
    return this.service.crear(dto)
  }

  @Get()
  listar() {
    return this.service.listar()
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.service.obtenerPorId(id)
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarProveedorDto) {
    return this.service.actualizar(id, dto)
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id') id: string) {
    return this.service.desactivar(id)
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.service.eliminar(id)
  }
}
