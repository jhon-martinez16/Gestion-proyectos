import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { FacturasClienteService } from './facturas-cliente.service'
import { CrearFacturaClienteDto } from './dto/crear-factura-cliente.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('facturas-cliente')
export class FacturasClienteController {
  constructor(private readonly service: FacturasClienteService) {}

  @Post()
  crear(@Body() dto: CrearFacturaClienteDto, @Req() req: any) {
    return this.service.crear(dto, req.user)
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
