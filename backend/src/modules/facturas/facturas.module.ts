import { Module } from '@nestjs/common'
import { FacturasController } from './facturas.controller'
import { FacturasService } from './facturas.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [FacturasController],
  providers: [FacturasService],
})
export class FacturasModule {}
