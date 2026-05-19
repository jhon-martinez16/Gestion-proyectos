import { Module } from '@nestjs/common'
import { EntregablesService } from './entregables.service'
import { EntregablesController } from './entregables.controller'
import { EntregablesScheduler } from './entregables.scheduler'
import { CommonModule } from '../../common/common.module'

@Module({
  imports: [CommonModule],
  controllers: [EntregablesController],
  providers: [EntregablesService, EntregablesScheduler],
})
export class EntregablesModule {}
