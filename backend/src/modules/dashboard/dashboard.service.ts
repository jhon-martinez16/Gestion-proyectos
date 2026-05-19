import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
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

    let misProyectosActivos: any[] = []
    let misCompromisosVencidos: any[] = []
    let misEntregablesProximos7Dias: any[] = []

    if (usuario?.rol === 'SOCIO') {
      const [proyActivos, compVencidos, entProximos] = await Promise.all([
        this.prisma.proyecto.findMany({
          where: {
            estado: { not: EstadoProyecto.FINALIZADO },
            ...proyectoFilter,
          },
          select: { id: true, nombre: true, estado: true, etapa: true, fechaFin: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.compromiso.findMany({
          where: {
            estado: EstadoCompromiso.PENDIENTE,
            fechaActual: { lt: hoy },
            proyecto: proyectoFilter,
          },
          select: {
            id: true,
            descripcion: true,
            fechaActual: true,
            proyecto: { select: { id: true, nombre: true } },
          },
          orderBy: { fechaActual: 'asc' },
          take: 10,
        }),
        this.prisma.entregable.findMany({
          where: {
            estado: { not: EstadoEntregable.COMPLETADO },
            clienteAprobado: false,
            fechaEntrega: { gte: hoy, lte: en7Dias },
            proyecto: proyectoFilter,
          },
          select: {
            id: true,
            nombre: true,
            fechaEntrega: true,
            estado: true,
            proyecto: { select: { id: true, nombre: true } },
          },
          orderBy: { fechaEntrega: 'asc' },
        }),
      ])
      misProyectosActivos = proyActivos
      misCompromisosVencidos = compVencidos
      misEntregablesProximos7Dias = entProximos
    }

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
      socio: {
        misProyectosActivos,
        misCompromisosVencidos,
        misEntregablesProximos7Dias,
      },
    }
  }
}
