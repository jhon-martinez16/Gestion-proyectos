import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common'
import { NotificacionesService } from './notificaciones.service'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Get()
  obtener(@Req() req: any) {
    return this.service.obtenerNoLeidas(req.user.sub)
  }

  @Patch(':id/leer')
  marcarLeida(@Param('id') id: string, @Req() req: any) {
    return this.service.marcarLeida(id, req.user.sub)
  }

  @Patch('leer-todas')
  marcarTodasLeidas(@Req() req: any) {
    return this.service.marcarTodasLeidas(req.user.sub)
  }
}
