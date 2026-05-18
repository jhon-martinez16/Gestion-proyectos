import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from 'src/prisma/prisma.service'
import { EstadoEntregable } from '@prisma/client'

@Injectable()
export class EntregablesScheduler {
  private readonly logger = new Logger(EntregablesScheduler.name)

  constructor(private prisma: PrismaService) {}

  @Cron('0 8 * * *')
  async actualizarEstadosEntregables() {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const en3Dias = new Date(hoy)
    en3Dias.setDate(hoy.getDate() + 3)

    const pendientes = await this.prisma.entregable.findMany({
      where: { estado: EstadoEntregable.PENDIENTE },
    })

    let actualizados = 0

    for (const e of pendientes) {
      const fechaEntrega = new Date(e.fechaEntrega)
      fechaEntrega.setHours(0, 0, 0, 0)

      let nuevoEstado: EstadoEntregable | null = null

      if (fechaEntrega < hoy) {
        nuevoEstado = EstadoEntregable.VENCIDO
      } else if (fechaEntrega <= en3Dias) {
        nuevoEstado = EstadoEntregable.URGENTE
      }

      if (nuevoEstado) {
        await this.prisma.entregable.update({
          where: { id: e.id },
          data: { estado: nuevoEstado },
        })

        await this.prisma.historialProyecto.create({
          data: {
            proyectoId: e.proyectoId,
            accion: nuevoEstado === EstadoEntregable.VENCIDO
              ? 'ENTREGABLE_VENCIDO_AUTO'
              : 'ENTREGABLE_URGENTE_AUTO',
            detalle: `Entregable "${e.nombre}" marcado como ${nuevoEstado} automáticamente`,
          },
        })

        actualizados++
      }
    }

    if (actualizados > 0) {
      this.logger.log(`Scheduler: ${actualizados} entregable(s) actualizados`)
    }
  }
}
