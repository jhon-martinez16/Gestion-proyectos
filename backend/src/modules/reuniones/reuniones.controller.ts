import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { ReunionesService } from './reuniones.service'
import { CrearReunionDto } from './dto/crear-reunion.dto'
import { ActualizarReunionDto } from './dto/actualizar-reunion.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('reuniones')
export class ReunionesController {
  constructor(private service: ReunionesService) {}

  @Post()
  crear(@Body() dto: CrearReunionDto, @Req() req: any) {
    return this.service.crear(dto, req.user)
  }

  @Get('proximas')
  listarProximas() {
    return this.service.listarProximas()
  }

  @Get('proyecto/:proyectoId')
  listarPorProyecto(@Param('proyectoId') proyectoId: string) {
    return this.service.listarPorProyecto(proyectoId)
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.service.obtenerPorId(id)
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarReunionDto, @Req() req: any) {
    return this.service.actualizar(id, dto, req.user)
  }

  @Delete(':id')
  eliminar(@Param('id') id: string, @Req() req: any) {
    return this.service.eliminar(id, req.user)
  }
}
