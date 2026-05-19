import { Module } from '@nestjs/common'
import { FeedbackClienteController } from './feedback-cliente.controller'
import { FeedbackClienteService } from './feedback-cliente.service'

@Module({
  controllers: [FeedbackClienteController],
  providers: [FeedbackClienteService],
})
export class FeedbackClienteModule {}
