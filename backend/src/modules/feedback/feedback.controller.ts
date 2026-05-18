import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { FeedbackService } from './feedback.service'
import { CrearFeedbackDto } from './dto/crear-feedback.dto'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Post()
  crear(@Body() dto: CrearFeedbackDto, @Req() req: any) {
    return this.service.crear(dto, req.user)
  }

  @Get('proyecto/:proyectoId')
  listarPorProyecto(@Param('proyectoId') proyectoId: string, @Req() req: any) {
    return this.service.listarPorProyecto(proyectoId, req.user)
  }

  @Delete(':id')
  eliminar(@Param('id') id: string, @Req() req: any) {
    return this.service.eliminar(id, req.user)
  }
}
