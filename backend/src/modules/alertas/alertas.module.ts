import { Module } from '@nestjs/common'
import { AlertasController } from './alertas.controller'
import { AlertasService } from './alertas.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [AlertasController],
  providers: [AlertasService],
})
export class AlertasModule {}
