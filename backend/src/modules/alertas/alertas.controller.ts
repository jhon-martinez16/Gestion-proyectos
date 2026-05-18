import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { AlertasService } from './alertas.service'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('alertas')
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  @Get()
  obtener(@Req() req: any) {
    return this.alertasService.obtenerAlertas(req.user)
  }
}
