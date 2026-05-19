import { Module } from '@nestjs/common'
import { PagosClienteController } from './pagos-cliente.controller'
import { PagosClienteService } from './pagos-cliente.service'
import { PagosClienteScheduler } from './pagos-cliente.scheduler'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [PagosClienteController],
  providers: [PagosClienteService, PagosClienteScheduler],
  exports: [PagosClienteService],
})
export class PagosClienteModule {}
