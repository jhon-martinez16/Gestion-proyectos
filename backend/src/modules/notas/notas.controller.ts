import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common'
import { NotasService } from './notas.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { IsString } from 'class-validator'

class UpsertNotaDto {
  @IsString()
  contenido: string
}

@UseGuards(JwtAuthGuard)
@Controller('notas')
export class NotasController {
  constructor(private readonly service: NotasService) {}

  @Get('proyecto/:proyectoId')
  obtener(@Param('proyectoId') proyectoId: string) {
    return this.service.obtener(proyectoId)
  }

  @Put('proyecto/:proyectoId')
  upsert(@Param('proyectoId') proyectoId: string, @Body() dto: UpsertNotaDto, @Req() req: any) {
    return this.service.upsert(proyectoId, dto.contenido, req.user)
  }
}
