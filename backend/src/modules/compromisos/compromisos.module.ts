import { Module } from '@nestjs/common'
import { CompromisosService } from './compromisos.service'
import { CompromisosController } from './compromisos.controller'
import { PrismaModule } from '../../prisma/prisma.module'
import { CommonModule } from '../../common/common.module'

@Module({
  imports: [
    PrismaModule,
    CommonModule, 
  ],
  controllers: [CompromisosController],
  providers: [CompromisosService],
})
export class CompromisosModule {}
