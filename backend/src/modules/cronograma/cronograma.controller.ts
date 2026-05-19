import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { CronogramaService } from './cronograma.service'
import { CrearVersionDto } from './dto/crear-version.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('cronograma')
export class CronogramaController {
  constructor(private readonly service: CronogramaService) {}

  @Post('proyecto/:proyectoId')
  crearVersion(@Param('proyectoId') proyectoId: string, @Body() dto: CrearVersionDto, @Req() req: any) {
    return this.service.crearVersion(proyectoId, dto, req.user)
  }

  @Get('proyecto/:proyectoId')
  listar(@Param('proyectoId') proyectoId: string) {
    return this.service.listarPorProyecto(proyectoId)
  }

  @Patch(':id/aprobar-cliente')
  aprobarCliente(@Param('id') id: string) {
    return this.service.aprobarCliente(id)
  }
}
