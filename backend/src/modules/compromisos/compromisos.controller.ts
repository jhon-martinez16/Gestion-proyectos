import { Controller, Post, Body, Get, Param, Patch, Delete, Req, UseGuards } from '@nestjs/common'
import { CompromisosService } from './compromisos.service'
import { CrearCompromisoDto } from './dto/crear-compromiso.dto'
import { ResolverCompromisoDto } from './dto/resolver-compromiso.dto'
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
  crear(@Body() dto: CrearCompromisoDto, @Req() req: any) {
    return this.service.crear(dto, req.user)
  }

  @Get('vencidos/:proyectoId')
  vencidos(@Param('proyectoId') proyectoId: string) {
    return this.service.obtenerVencidos(proyectoId)
  }

  @Patch(':id/resolver')
  resolver(@Param('id') id: string, @Body() dto: ResolverCompromisoDto, @Req() req: any) {
    return this.service.resolver(id, dto, req.user)
  }

  @Get('proyecto/:proyectoId')
  listarPorProyecto(@Param('proyectoId') proyectoId: string) {
    return this.service.listarPorProyecto(proyectoId)
  }

  @Delete(':id')
  eliminar(@Param('id') id: string, @Req() req: any) {
    return this.service.eliminar(id, req.user)
  }
}
