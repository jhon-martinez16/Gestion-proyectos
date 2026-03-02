import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common'
import { CompromisosService } from './compromisos.service'
import { CrearCompromisoDto } from './dto/crear-compromiso.dto'
import { ResolverCompromisoDto } from './dto/resolver-compromiso.dto'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('compromisos')
export class CompromisosController {
  constructor(private service: CompromisosService) {}

  @Get()
  listarTodos() {
  return this.service.listarTodos()
  }

  @Post()
  crear(@Body() dto: CrearCompromisoDto) {
    return this.service.crear(dto)
  }

  @Get('vencidos/:proyectoId')
  vencidos(@Param('proyectoId') proyectoId: string) {
    return this.service.obtenerVencidos(proyectoId)
  }

  
  @Patch(':id/resolver')
  resolver(@Param('id') id: string, @Body() dto: ResolverCompromisoDto) {
    return this.service.resolver(id, dto)
  }

  @Get('proyecto/:proyectoId')
  listarPorProyecto(@Param('proyectoId') proyectoId: string) {
  return this.service.listarPorProyecto(proyectoId)
}
}


