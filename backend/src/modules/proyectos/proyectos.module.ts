import { Module } from '@nestjs/common'
import { ProyectosService } from './proyectos.service'
import { ProyectosController } from './proyectos.controller'
import { CommonModule } from 'src/common/common.module'
import { NotificacionesModule } from 'src/modules/notificaciones/notificaciones.module'

@Module({
  imports: [CommonModule, NotificacionesModule],
  controllers: [ProyectosController],
  providers: [ProyectosService],
})
export class ProyectosModule {}
