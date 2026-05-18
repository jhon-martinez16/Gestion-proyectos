import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { ProyectosService } from './proyectos.service'
import { CrearProyectoDto } from './dto/crear-proyecto.dto'
import { ActualizarProyectoDto } from './dto/actualizar-proyecto.dto'
import { EvaluadorProyectoService } from 'src/common/services/evaluador-proyecto.service'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { RolesGuard } from 'src/auth/roles.guard'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { Rol } from '@prisma/client'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proyectos')
export class ProyectosController {
  constructor(
    private service: ProyectosService,
    private evaluadorProyectoService: EvaluadorProyectoService, // 👈 agregado
  ) {}

  @Post()
  crear(@Body() dto: CrearProyectoDto) {
    return this.service.crear(dto)
  }

  @Get()
  obtenerTodos() {
    return this.service.obtenerTodos()
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.service.obtenerPorId(id)
  }

  @Get(':id/advertencias')
  obtenerAdvertencias(@Param('id') id: string) {
    return this.evaluadorProyectoService.obtenerAdvertenciasProyecto(id)
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarProyectoDto, @Req() req: any) {
    return this.service.actualizar(id, dto, req.user)
  }

  @Roles(Rol.ADMIN)
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.service.eliminar(id)
  }
}