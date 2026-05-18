import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { FacturasService } from './facturas.service'
import { CrearFacturaDto } from './dto/crear-factura.dto'
import { ActualizarFacturaDto, ProgramarPagoDto, EjecutarPagoDto, ConfirmarPagoDto } from './dto/actualizar-factura.dto'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { RolesGuard } from 'src/auth/roles.guard'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { Rol } from '@prisma/client'

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN, Rol.ADMINISTRATIVO)
@Controller('facturas')
export class FacturasController {
  constructor(private readonly service: FacturasService) {}

  @Post()
  crear(@Body() dto: CrearFacturaDto) {
    return this.service.crear(dto)
  }

  @Get()
  listar() {
    return this.service.listar()
  }

  @Get('proyecto/:proyectoId')
  listarPorProyecto(@Param('proyectoId') proyectoId: string) {
    return this.service.listarPorProyecto(proyectoId)
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.service.obtenerPorId(id)
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarFacturaDto) {
    return this.service.actualizar(id, dto)
  }

  @Patch(':id/aprobar')
  aprobar(@Param('id') id: string) {
    return this.service.aprobar(id)
  }

  @Patch(':id/marcar-pagada')
  marcarPagada(@Param('id') id: string) {
    return this.service.marcarPagada(id)
  }

  @Patch(':id/rechazar')
  rechazar(@Param('id') id: string) {
    return this.service.rechazar(id)
  }

  @Patch(':id/programar-pago')
  programarPago(@Param('id') id: string, @Body() dto: ProgramarPagoDto) {
    return this.service.programarPago(id, dto)
  }

  @Patch(':id/ejecutar-pago')
  ejecutarPago(@Param('id') id: string, @Body() dto: EjecutarPagoDto) {
    return this.service.ejecutarPago(id, dto)
  }

  @Patch(':id/confirmar-pago')
  confirmarPago(@Param('id') id: string, @Body() dto: ConfirmarPagoDto) {
    return this.service.confirmarPago(id, dto)
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.service.eliminar(id)
  }
}
