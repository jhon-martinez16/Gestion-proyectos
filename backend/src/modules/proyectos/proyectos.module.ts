import { Module } from '@nestjs/common'
import { ProyectosService } from './proyectos.service'
import { ProyectosController } from './proyectos.controller'
import { CommonModule } from 'src/common/common.module'

@Module({
  imports: [CommonModule],
  controllers: [ProyectosController],
  providers: [ProyectosService],
})
export class ProyectosModule {}
