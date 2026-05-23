import { IsString, IsArray, IsObject } from 'class-validator'

export class ChatDto {
  @IsString()
  mensaje: string

  @IsArray()
  historial: { role: 'user' | 'assistant'; content: string }[]

  @IsObject()
  contextoProyecto: Record<string, unknown>
}
