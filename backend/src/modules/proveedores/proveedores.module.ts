import { Module } from '@nestjs/common'
import { ProveedoresController } from './proveedores.controller'
import { ProveedoresService } from './proveedores.service'
import { PrismaModule } from 'src/prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ProveedoresController],
  providers: [ProveedoresService],
})
export class ProveedoresModule {}
