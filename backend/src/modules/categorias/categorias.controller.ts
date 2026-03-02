import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common'
import { CategoriasService } from './categorias.service'
import { CrearCategoriaDto } from './dto/crear-categoria.dto'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'


@UseGuards(JwtAuthGuard)
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

  @Patch(':id/desactivar')
  desactivar(@Param('id') id: string) {
    return this.service.desactivar(id)
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.service.eliminar(id)
  }
}
