  import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    Patch,
    Delete,
  } from '@nestjs/common'
  import { EntregablesService } from './entregables.service'
  import { CrearEntregableDto } from './dto/crear-entregable.dto'
  import { ActualizarEntregableDto } from './dto/actualizar-entregable.dto'
  import { UseGuards } from '@nestjs/common'
  import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'


  @UseGuards(JwtAuthGuard)
  @Controller('entregables')
  export class EntregablesController {
    constructor(private service: EntregablesService) {}

    @Post()
    crear(@Body() dto: CrearEntregableDto) {
      return this.service.crear(dto)
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
    actualizar(
      @Param('id') id: string,
      @Body() dto: ActualizarEntregableDto,
    ) {
      return this.service.actualizar(id, dto)
    }

    @Delete(':id')
    eliminar(@Param('id') id: string) {
      return this.service.eliminar(id)
    }
  }
