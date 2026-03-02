import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common'
import { ProyectosService } from './proyectos.service'
import { CrearProyectoDto } from './dto/crear-proyecto.dto'
import { ActualizarProyectoDto } from './dto/actualizar-proyecto.dto'

@Controller('proyectos')
export class ProyectosController {
  constructor(private service: ProyectosService) {}

  @Post()
  crear(@Body() dto: CrearProyectoDto) {
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
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarProyectoDto,
  ) {
    return this.service.actualizar(id, dto)
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.service.eliminar(id)
  }

  @Get(':id/historial')
  historial(@Param('id') id: string) {
    return this.service.historial(id)
  }
}
