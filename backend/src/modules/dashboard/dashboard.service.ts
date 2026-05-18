import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import {
  EstadoProyecto,
  EstadoCompromiso,
  EstadoEntregable,
  EstadoFactura,
} from '@prisma/client'

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async obtenerResumen(usuario?: { sub: string; rol: string }) {
    const hoy = new Date()
    const en7Dias = new Date()
    en7Dias.setDate(hoy.getDate() + 7)

    // For SOCIO: restrict to their projects
    const proyectoFilter =
      usuario?.rol === 'SOCIO'
        ? { OR: [{ liderId: usuario.sub }, { socio2Id: usuario.sub }] }
        : {}

    const [
      totalProyectos,
      enRiesgo,
      advertencia,
      compromisosVencidos,
      entregablesUrgentes,
      entregablesProximos,
      usuariosActivos,
      categoriasActivas,
      totalFacturadoAgg,
      facturasPendientes,
      montoPorCobrarAgg,
      proveedoresActivos,
    ] = await Promise.all([
      this.prisma.proyecto.count({ where: proyectoFilter }),

      this.prisma.proyecto.count({
        where: { estado: EstadoProyecto.EN_RIESGO, ...proyectoFilter },
      }),

      this.prisma.proyecto.count({
        where: { estado: EstadoProyecto.ADVERTENCIA, ...proyectoFilter },
      }),

      this.prisma.compromiso.count({
        where: {
          estado: EstadoCompromiso.PENDIENTE,
          fechaActual: { lt: hoy },
          proyecto: proyectoFilter,
        },
      }),

      this.prisma.entregable.count({
        where: {
          estado: EstadoEntregable.URGENTE,
          proyecto: proyectoFilter,
        },
      }),

      this.prisma.entregable.count({
        where: {
          estado: EstadoEntregable.PENDIENTE,
          fechaEntrega: { gte: hoy, lte: en7Dias },
          proyecto: proyectoFilter,
        },
      }),

      this.prisma.usuario.count({ where: { activo: true } }),

      this.prisma.categoria.count({ where: { activa: true } }),

      this.prisma.factura.aggregate({
        _sum: { monto: true },
        where: {
          estado: EstadoFactura.PAGADA,
          proyecto: proyectoFilter,
        },
      }),

      this.prisma.factura.count({
        where: {
          estado: EstadoFactura.PENDIENTE,
          proyecto: proyectoFilter,
        },
      }),

      this.prisma.factura.aggregate({
        _sum: { monto: true },
        where: {
          estado: EstadoFactura.APROBADA,
          proyecto: proyectoFilter,
        },
      }),

      this.prisma.proveedor.count({ where: { activo: true } }),
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
      financiero: {
        totalFacturado: Number(totalFacturadoAgg._sum.monto ?? 0),
        facturasPendientes,
        montoPorCobrar: Number(montoPorCobrarAgg._sum.monto ?? 0),
        proveedoresActivos,
      },
    }
  }
}
