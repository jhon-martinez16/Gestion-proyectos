import { Module } from '@nestjs/common'
import { EntregablesService } from './entregables.service'
import { EntregablesController } from './entregables.controller'
import { CommonModule } from 'src/common/common.module'

@Module({
  imports: [CommonModule],
  controllers: [EntregablesController],
  providers: [EntregablesService],
})
export class EntregablesModule {}
