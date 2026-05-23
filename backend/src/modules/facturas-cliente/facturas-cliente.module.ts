import { Module } from '@nestjs/common'
import { FacturasClienteController } from './facturas-cliente.controller'
import { FacturasClienteService } from './facturas-cliente.service'

@Module({
  controllers: [FacturasClienteController],
  providers: [FacturasClienteService],
})
export class FacturasClienteModule {}
