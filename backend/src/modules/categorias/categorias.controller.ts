import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common'
import { CategoriasService } from './categorias.service'
import { CrearCategoriaDto } from './dto/crear-categoria.dto'
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto'
//import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
//import { RolesGuard } from '../../auth/roles.guard'
//import { Roles } from '../../auth/decorators/roles.decorator'
import { Rol } from '@prisma/client'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categorias')
export class CategoriasController {
  constructor(private service: CategoriasService) {}

  @Post()
  crear(@Body() dto: CrearCategoriaDto) {
    return this.service.crear(dto)
  }

  @Get()
  listar() {
    return this.service.listar()
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarCategoriaDto) {
    return this.service.actualizar(id, dto)
  }

  @Roles(Rol.ADMIN)
  @Patch(':id/desactivar')
  desactivar(@Param('id') id: string) {
    return this.service.desactivar(id)
  }

  @Roles(Rol.ADMIN)
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.service.eliminar(id)
  }
}
