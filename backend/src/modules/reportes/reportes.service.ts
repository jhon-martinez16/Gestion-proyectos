import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { EstadoProyecto, EstadoCompromiso, EstadoFactura } from '@prisma/client'

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  async obtenerReporte() {
    const [
      proyectos,
      compromisos,
      entregables,
      facturas,
      pagosCliente,
    ] = await Promise.all([
      this.prisma.proyecto.findMany({
        include: {
          lider: { select: { id: true, nombre: true } },
          compromisos: true,
          entregables: true,
          pagosCliente: true,
        },
      }),
      this.prisma.compromiso.findMany(),
      this.prisma.entregable.findMany(),
      this.prisma.factura.findMany({ include: { proyecto: { select: { id: true, nombre: true } } } }),
      this.prisma.pagoCliente.findMany({ include: { proyecto: { select: { id: true, nombre: true } } } }),
    ])

    // Proyectos por estado
    const porEstado: Record<string, number> = {}
    for (const e of Object.values(EstadoProyecto)) {
      porEstado[e] = proyectos.filter((p) => p.estado === e).length
    }

    // % compromisos cumplidos
    const totalCompromisos = compromisos.length
    const cumplidos = compromisos.filter((c) => c.estado === EstadoCompromiso.CUMPLIDO).length
    const pctCompromisosCumplidos = totalCompromisos > 0 ? Math.round((cumplidos / totalCompromisos) * 100) : 0

    // % entregables aprobados
    const totalEntregables = entregables.length
    const aprobados = entregables.filter((e) => e.clienteAprobado).length
    const pctEntregablesAprobados = totalEntregables > 0 ? Math.round((aprobados / totalEntregables) * 100) : 0

    // Financiero facturas
    const totalFacturado = facturas.reduce((s, f) => s + Number(f.monto), 0)
    const totalPendienteFactura = facturas.filter((f) => f.estado === EstadoFactura.PENDIENTE).reduce((s, f) => s + Number(f.monto), 0)
    const facturasPorEstado: Record<string, { count: number; monto: number }> = {}
    for (const e of Object.values(EstadoFactura)) {
      const lst = facturas.filter((f) => f.estado === e)
      facturasPorEstado[e] = { count: lst.length, monto: lst.reduce((s, f) => s + Number(f.monto), 0) }
    }

    // Pagos cliente
    const totalEsperadoCliente = pagosCliente.reduce((s, p) => s + Number(p.montoEsperado), 0)
    const totalRecibidoCliente = pagosCliente.reduce((s, p) => s + Number(p.montoRecibido ?? 0), 0)

    // Pagos por proyecto
    const pagosPorProyecto = proyectos.map((p) => ({
      proyectoId: p.id,
      proyectoNombre: p.nombre,
      cuotasEsperadas: p.pagosCliente.length,
      cuotasRecibidas: p.pagosCliente.filter((pc) => pc.estado === 'RECIBIDO' || pc.estado === 'PARCIAL').length,
      montoEsperado: p.pagosCliente.reduce((s, pc) => s + Number(pc.montoEsperado), 0),
      montoRecibido: p.pagosCliente.reduce((s, pc) => s + Number(pc.montoRecibido ?? 0), 0),
    }))

    // Performance por líder (basado en proyectos liderados)
    const lideresMap: Record<string, { liderId: string; liderNombre: string; compromisos: any[]; entregables: any[] }> = {}
    for (const p of proyectos) {
      if (!lideresMap[p.liderId]) {
        lideresMap[p.liderId] = { liderId: p.liderId, liderNombre: p.lider.nombre, compromisos: [], entregables: [] }
      }
      lideresMap[p.liderId].compromisos.push(...p.compromisos)
      lideresMap[p.liderId].entregables.push(...p.entregables)
    }
    const performanceLideres = Object.values(lideresMap).map((l) => ({
      liderId: l.liderId,
      liderNombre: l.liderNombre,
      compromisosCumplidos: l.compromisos.filter((c) => c.estado === EstadoCompromiso.CUMPLIDO).length,
      compromisosTotal: l.compromisos.length,
      entregablesAprobados: l.entregables.filter((e) => e.clienteAprobado).length,
      entregablesTotal: l.entregables.length,
    }))

    return {
      resumen: {
        porEstado,
        pctCompromisosCumplidos,
        pctEntregablesAprobados,
        totalProyectos: proyectos.length,
      },
      financiero: {
        totalFacturado,
        totalPendienteFactura,
        totalEsperadoCliente,
        totalRecibidoCliente,
        pendienteCliente: totalEsperadoCliente - totalRecibidoCliente,
        facturasPorEstado,
      },
      pagosPorProyecto,
      performanceLideres,
    }
  }
}
