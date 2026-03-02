import { Module } from '@nestjs/common'
import { CompromisosService } from './compromisos.service'
import { CompromisosController } from './compromisos.controller'
import { PrismaModule } from 'src/prisma/prisma.module'
import { CommonModule } from 'src/common/common.module'

@Module({
  imports: [
    PrismaModule,
    CommonModule, 
  ],
  controllers: [CompromisosController],
  providers: [CompromisosService],
})
export class CompromisosModule {}
