import { Controller, Get } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get()
  obtenerResumen() {
    return this.service.obtenerResumen()
  }
}
