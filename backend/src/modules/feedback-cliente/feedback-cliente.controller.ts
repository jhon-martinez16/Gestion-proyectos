import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { FeedbackClienteService } from './feedback-cliente.service'
import { CrearFeedbackClienteDto } from './dto/crear-feedback-cliente.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { RolesGuard } from '../../auth/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { Rol } from '@prisma/client'

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN, Rol.SOCIO)
@Controller('feedback-cliente')
export class FeedbackClienteController {
  constructor(private readonly service: FeedbackClienteService) {}

  @Post()
  crear(@Body() dto: CrearFeedbackClienteDto, @Req() req: any) {
    return this.service.crear(dto, req.user)
  }

  @Get('proyecto/:proyectoId')
  listarPorProyecto(@Param('proyectoId') proyectoId: string) {
    return this.service.listarPorProyecto(proyectoId)
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.service.eliminar(id)
  }
}
