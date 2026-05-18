import { Module } from '@nestjs/common'
import { NotasController } from './notas.controller'
import { NotasService } from './notas.service'
import { PrismaModule } from 'src/prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [NotasController],
  providers: [NotasService],
})
export class NotasModule {}
