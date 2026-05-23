import { Injectable, InternalServerErrorException } from '@nestjs/common'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-sonnet-4-5'
const HISTORIAL_MAX = 6

const SYSTEM_CHAT = `Eres un asistente experto en gestión de proyectos de consultoría para Logique Consulting. \
Tienes acceso al estado completo del proyecto. Tu rol es analizar la situación, identificar riesgos y \
recomendar acciones concretas. Sé directo y conciso. Responde siempre en español.`

const SYSTEM_ACTA = `Eres un asistente experto en redacción de actas de reunión para consultoría. \
A partir del resumen informal genera objetivos y próximos pasos profesionales. \
Responde SOLO este JSON sin nada más: {"objetivos": "...", "proximos_pasos": "..."}`

@Injectable()
export class AiService {
  private readonly client: Anthropic

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async chatProyecto(
    mensaje: string,
    historial: { role: 'user' | 'assistant'; content: string }[],
    contextoProyecto: Record<string, unknown>,
  ): Promise<string> {
    const ultimos = historial.slice(-HISTORIAL_MAX)

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: `Contexto del proyecto:\n${JSON.stringify(contextoProyecto, null, 2)}` },
      { role: 'assistant', content: 'Entendido. He revisado el estado del proyecto. ¿En qué puedo ayudarte?' },
      ...ultimos,
      { role: 'user', content: mensaje },
    ]

    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 500,
        system: SYSTEM_CHAT,
        messages,
      })

      const block = response.content[0]
      if (block.type !== 'text') throw new Error('Respuesta inesperada de Anthropic')
      return block.text
    } catch (err) {
      console.error('[AiService.chatProyecto]', err)
      throw new InternalServerErrorException(`Error al consultar IA: ${(err as Error).message}`)
    }
  }

  async generarActa(
    resumenInformal: string,
    contextoProyecto: Record<string, unknown>,
  ): Promise<{ objetivos: string; proximos_pasos: string }> {
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `Contexto del proyecto:\n${JSON.stringify(contextoProyecto, null, 2)}\n\nResumen informal:\n${resumenInformal}`,
      },
    ]

    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM_ACTA,
        messages,
      })

      const block = response.content[0]
      if (block.type !== 'text') throw new Error('Respuesta inesperada de Anthropic')

      const textoLimpio = block.text.replace(/```json/g, '').replace(/```/g, '').trim()
      return JSON.parse(textoLimpio) as { objetivos: string; proximos_pasos: string }
    } catch (err) {
      console.error('[AiService.generarActa]', err)
      throw new InternalServerErrorException(`Error al generar acta: ${(err as Error).message}`)
    }
  }

  async generarPropuesta(datos: {
    nombreCliente: string
    tipoProyecto: string
    duracionEstimada: string
    presupuesto: string
    objetivos: string
    contextoAdicional?: string
  }): Promise<{
    resumenEjecutivo: string
    alcance: string
    entregables: string
    cronograma: string
    condicionesComerciales: string
  }> {
    const prompt = `Cliente: ${datos.nombreCliente}
Tipo de proyecto: ${datos.tipoProyecto}
Duración estimada: ${datos.duracionEstimada}
Presupuesto: ${datos.presupuesto}
Objetivos: ${datos.objetivos}${datos.contextoAdicional ? `\nContexto adicional: ${datos.contextoAdicional}` : ''}`

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: prompt },
    ]

    const system = `Eres un consultor de Logique Consulting. Genera una propuesta profesional y concisa. Cada sección máximo 3 oraciones cortas. Usa siempre pesos colombianos (COP) como moneda, nunca MXN ni USD. Responde ÚNICAMENTE JSON válido sin markdown: {"resumenEjecutivo":"máx 3 oraciones","alcance":"máx 3 oraciones","entregables":"máx 3 oraciones","cronograma":"máx 3 oraciones","condicionesComerciales":"máx 3 oraciones"}`

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system,
        messages,
      })

      const block = response.content[0]
      if (block.type !== 'text') throw new Error('Respuesta inesperada de Anthropic')

      const textoLimpio = block.text.replace(/```json/g, '').replace(/```/g, '').trim()
      return JSON.parse(textoLimpio)
    } catch (err) {
      console.error('[AiService.generarPropuesta]', err)
      throw new InternalServerErrorException(`Error al generar propuesta: ${(err as Error).message}`)
    }
  }

  async sugerirObjetivos(tipoProyecto: string): Promise<{ objetivos: string[] }> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: `Tipo de proyecto: ${tipoProyecto}` },
    ]

    const system = `Eres un consultor de Logique Consulting. Genera exactamente 6 objetivos profesionales para el tipo de proyecto indicado. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones, sin backticks. Formato exacto: {"objetivos":["objetivo 1","objetivo 2","objetivo 3","objetivo 4","objetivo 5","objetivo 6"]}`

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system,
        messages,
      })

      const block = response.content[0]
      if (block.type !== 'text') throw new Error('Respuesta inesperada de Anthropic')

      const textoLimpio = block.text.replace(/```json/g, '').replace(/```/g, '').trim()
      return JSON.parse(textoLimpio)
    } catch (err) {
      console.error('[AiService.sugerirObjetivos]', err)
      throw new InternalServerErrorException(`Error al sugerir objetivos: ${(err as Error).message}`)
    }
  }
}
