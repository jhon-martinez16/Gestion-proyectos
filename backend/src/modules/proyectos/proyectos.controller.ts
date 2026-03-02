import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ProyectosService } from './proyectos.service'
import { CrearProyectoDto } from './dto/crear-proyecto.dto'
import { EvaluadorProyectoService } from 'src/common/services/evaluador-proyecto.service'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'


@UseGuards(JwtAuthGuard)
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
}