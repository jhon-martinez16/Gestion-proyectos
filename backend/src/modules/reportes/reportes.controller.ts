import { Controller, Get, UseGuards } from '@nestjs/common'
import { ReportesService } from './reportes.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { RolesGuard } from '../../auth/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { Rol } from '@prisma/client'

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN, Rol.ADMINISTRATIVO)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Get()
  obtener() {
    return this.service.obtenerReporte()
  }
}
