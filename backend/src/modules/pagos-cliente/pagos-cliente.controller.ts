import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { PagosClienteService } from './pagos-cliente.service'
import { CrearPagoClienteDto } from './dto/crear-pago-cliente.dto'
import { MarcarRecibidoDto } from './dto/marcar-recibido.dto'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('pagos-cliente')
export class PagosClienteController {
  constructor(private readonly service: PagosClienteService) {}

  @Post()
  crear(@Body() dto: CrearPagoClienteDto, @Req() req: any) {
    return this.service.crear(dto, req.user)
  }

  @Get('proyecto/:proyectoId')
  listarPorProyecto(@Param('proyectoId') proyectoId: string) {
    return this.service.listarPorProyecto(proyectoId)
  }

  @Patch(':id/marcar-recibido')
  marcarRecibido(@Param('id') id: string, @Body() dto: MarcarRecibidoDto, @Req() req: any) {
    return this.service.marcarRecibido(id, dto, req.user)
  }

  @Delete(':id')
  eliminar(@Param('id') id: string, @Req() req: any) {
    return this.service.eliminar(id, req.user)
  }
}
