import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { AiService } from './ai.service'
import { ChatDto } from './dto/chat.dto'
import { GenerarActaDto } from './dto/generar-acta.dto'
import { GenerarPropuestaDto } from './dto/generar-propuesta.dto'
import { SugerirObjetivosDto } from './dto/sugerir-objetivos.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  chat(@Body() dto: ChatDto) {
    return this.aiService.chatProyecto(dto.mensaje, dto.historial, dto.contextoProyecto)
  }

  @Post('generar-acta')
  generarActa(@Body() dto: GenerarActaDto) {
    return this.aiService.generarActa(dto.resumenInformal, dto.contextoProyecto)
  }

  @Post('generar-propuesta')
  generarPropuesta(@Body() dto: GenerarPropuestaDto) {
    return this.aiService.generarPropuesta(dto)
  }

  @Post('sugerir-objetivos')
  sugerirObjetivos(@Body() dto: SugerirObjetivosDto) {
    return this.aiService.sugerirObjetivos(dto.tipoProyecto)
  }
}
