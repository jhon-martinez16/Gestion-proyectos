import { Module } from '@nestjs/common'
import { EvaluadorProyectoService } from './services/evaluador-proyecto.service'
import { PrismaService } from 'src/prisma/prisma.service'

@Module({
  providers: [EvaluadorProyectoService, PrismaService],
  exports: [EvaluadorProyectoService],
})
export class CommonModule {}
