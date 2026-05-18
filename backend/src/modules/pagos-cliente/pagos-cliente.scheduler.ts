import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PagosClienteService } from './pagos-cliente.service'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class PagosClienteScheduler {
  constructor(
    private readonly pagosService: PagosClienteService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron('0 8 * * *')
  async marcarCuotasVencidas() {
    const afectados = await this.pagosService.actualizarVencidos()
    if (afectados.length === 0) return

    // Group by project
    const porProyecto = new Map<string, number[]>()
    for (const p of afectados) {
      const cuotas = porProyecto.get(p.proyectoId) ?? []
      cuotas.push(p.numeroCuota)
      porProyecto.set(p.proyectoId, cuotas)
    }

    await Promise.all(
      [...porProyecto.entries()].map(([proyectoId, cuotas]) =>
        this.prisma.historialProyecto.create({
          data: {
            proyectoId,
            accion: 'CUOTA_VENCIDA',
            detalle: `${cuotas.length} cuota(s) marcada(s) como vencida(s): ${cuotas.map((n) => `#${n}`).join(', ')}`,
          },
        }),
      ),
    )
  }
}
