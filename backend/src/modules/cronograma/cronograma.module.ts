import { Module } from '@nestjs/common'
import { CronogramaController } from './cronograma.controller'
import { CronogramaService } from './cronograma.service'
import { PrismaModule } from 'src/prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [CronogramaController],
  providers: [CronogramaService],
})
export class CronogramaModule {}
