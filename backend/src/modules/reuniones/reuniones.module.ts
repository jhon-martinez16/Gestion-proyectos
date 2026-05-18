import { Module } from '@nestjs/common'
import { ReunionesService } from './reuniones.service'
import { ReunionesController } from './reuniones.controller'
import { PrismaModule } from 'src/prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ReunionesController],
  providers: [ReunionesService],
})
export class ReunionesModule {}
