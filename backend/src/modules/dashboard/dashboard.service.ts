import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import {
  EstadoProyecto,
  EstadoCompromiso,
  EstadoEntregable,
} from '@prisma/client'

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async obtenerResumen() {
    const hoy = new Date()
    const en7Dias = new Date()
    en7Dias.setDate(hoy.getDate() + 7)

    const [
      totalProyectos,
      enRiesgo,
      advertencia,
      compromisosVencidos,
      entregablesUrgentes,
      entregablesProximos,
      usuariosActivos,
      categoriasActivas,
    ] = await Promise.all([
      this.prisma.proyecto.count(),

      this.prisma.proyecto.count({
        where: { estado: EstadoProyecto.EN_RIESGO },
      }),

      this.prisma.proyecto.count({
        where: { estado: EstadoProyecto.ADVERTENCIA },
      }),

      this.prisma.compromiso.count({
        where: {
          estado: EstadoCompromiso.PENDIENTE,
          fechaActual: { lt: hoy },
        },
      }),

      this.prisma.entregable.count({
        where: { estado: EstadoEntregable.URGENTE },
      }),

      this.prisma.entregable.count({
        where: {
          estado: EstadoEntregable.PENDIENTE,
          fechaEntrega: {
            gte: hoy,
            lte: en7Dias,
          },
        },
      }),

      this.prisma.usuario.count({
        where: { activo: true },
      }),

      this.prisma.categoria.count({
        where: { activa: true },
      }),
    ])

    return {
      proyectos: {
        total: totalProyectos,
        enRiesgo,
        advertencia,
      },
      compromisos: {
        vencidos: compromisosVencidos,
      },
      entregables: {
        urgentes: entregablesUrgentes,
        proximos7Dias: entregablesProximos,
      },
      organizacion: {
        usuariosActivos,
        categoriasActivas,
      },
    }
  }
}
