import { Module } from '@nestjs/common'
import { NotificacionesController } from './notificaciones.controller'
import { NotificacionesService } from './notificaciones.service'
import { PrismaModule } from 'src/prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
