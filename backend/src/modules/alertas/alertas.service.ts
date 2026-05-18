import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { EstadoCompromiso, EstadoEntregable, EtapaProyecto, PagoEstado } from '@prisma/client'

export interface Alerta {
  tipo: string
  mensaje: string
  proyectoId: string
  proyectoNombre: string
  nivel: 'CRITICA' | 'MEDIA'
}

@Injectable()
export class AlertasService {
  constructor(private prisma: PrismaService) {}

  async obtenerAlertas(usuario?: { sub: string; rol: string }): Promise<Alerta[]> {
    const hoy = new Date()
    const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
    const hace3Dias = new Date(hoy.getTime() - 3 * 24 * 60 * 60 * 1000)
    const hace5Dias = new Date(hoy.getTime() - 5 * 24 * 60 * 60 * 1000)
    const en7Dias   = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Filter projects by user for SOCIO role
    const proyectoFilter =
      usuario?.rol === 'SOCIO'
        ? { OR: [{ liderId: usuario.sub }, { socio2Id: usuario.sub }] }
        : {}

    const [
      compromisosVencidos,
      entregablesVencidos,
      propuestasSinAprobacion,
      sinKickoff,
      polizasPendientes,
      contratosPendientes,
      kickoffSinRealizar,
      entregablesProximosSinAprobar,
      cuotasVencidas,
      facturasSinFecha,
      pagosVencidos,
      confirmacionesPendientes,
      proyectosSinCuotas,
    ] = await Promise.all([
      // Compromisos vencidos
      this.prisma.compromiso.findMany({
        where: {
          estado: EstadoCompromiso.PENDIENTE,
          fechaActual: { lt: hoy },
          proyecto: proyectoFilter,
        },
        include: { proyecto: { select: { id: true, nombre: true } } },
      }),

      // Entregables vencidos sin aprobación
      this.prisma.entregable.findMany({
        where: {
          estado: { not: EstadoEntregable.COMPLETADO },
          clienteAprobado: false,
          fechaEntrega: { lt: hoy },
          proyecto: proyectoFilter,
        },
        include: { proyecto: { select: { id: true, nombre: true } } },
      }),

      // Proyectos en PROPUESTA > 7 días sin propuestaAprobada
      this.prisma.proyecto.findMany({
        where: {
          etapa: EtapaProyecto.PROPUESTA,
          propuestaAprobada: false,
          createdAt: { lt: hace7Dias },
          ...proyectoFilter,
        },
        select: { id: true, nombre: true },
      }),

      // Proyectos con contrato firmado > 3 días sin kick-off
      this.prisma.proyecto.findMany({
        where: {
          contratoFirmado: true,
          kickoffRealizado: false,
          createdAt: { lt: hace3Dias },
          ...proyectoFilter,
        },
        select: { id: true, nombre: true },
      }),

      // Proyectos que requieren póliza y no la tienen
      this.prisma.proyecto.findMany({
        where: {
          requierePoliza: true,
          polizaContratada: false,
          ...proyectoFilter,
        },
        select: { id: true, nombre: true },
      }),

      // Proyectos que requieren contrato, propuesta aprobada pero sin contrato firmado > 3 días
      this.prisma.proyecto.findMany({
        where: {
          requiereContrato: true,
          contratoFirmado: false,
          propuestaAprobada: true,
          createdAt: { lt: hace3Dias },
          ...proyectoFilter,
        },
        select: { id: true, nombre: true },
      }),

      // Proyectos en KICK_OFF > 5 días sin kickoffRealizado
      this.prisma.proyecto.findMany({
        where: {
          etapa: EtapaProyecto.KICK_OFF,
          kickoffRealizado: false,
          createdAt: { lt: hace5Dias },
          ...proyectoFilter,
        },
        select: { id: true, nombre: true },
      }),

      // Entregables próximos (< 7 días) sin aprobación del cliente
      this.prisma.entregable.findMany({
        where: {
          clienteAprobado: false,
          estado: { not: EstadoEntregable.COMPLETADO },
          fechaEntrega: { gte: hoy, lte: en7Dias },
          proyecto: proyectoFilter,
        },
        include: { proyecto: { select: { id: true, nombre: true } } },
      }),

      // Cuotas vencidas sin recibir
      this.prisma.pagoCliente.findMany({
        where: {
          estado: PagoEstado.VENCIDO,
          proyecto: proyectoFilter,
        },
        include: { proyecto: { select: { id: true, nombre: true } } },
      }),

      // Facturas APROBADAS sin fecha programada de pago
      this.prisma.factura.findMany({
        where: {
          estado: 'APROBADA',
          fechaProgramadaPago: null,
          proyecto: proyectoFilter,
        },
        include: { proyecto: { select: { id: true, nombre: true } } },
      }),

      // Facturas con fechaProgramadaPago vencida sin ejecutar
      this.prisma.factura.findMany({
        where: {
          pagoEjecutado: false,
          fechaProgramadaPago: { lt: hoy, not: null },
          proyecto: proyectoFilter,
        },
        include: { proyecto: { select: { id: true, nombre: true } } },
      }),

      // Facturas ejecutadas pendientes de confirmación financiera
      this.prisma.factura.findMany({
        where: {
          pagoEjecutado: true,
          confirmacionFinanciera: false,
          proyecto: proyectoFilter,
        },
        include: { proyecto: { select: { id: true, nombre: true } } },
      }),

      // Proyectos EN_CURSO sin cuotas registradas
      this.prisma.proyecto.findMany({
        where: {
          estado: { not: 'FINALIZADO' },
          pagosCliente: { none: {} },
          ...proyectoFilter,
        },
        select: { id: true, nombre: true },
      }),
    ])

    const alertas: Alerta[] = []

    for (const c of compromisosVencidos) {
      alertas.push({
        tipo: 'COMPROMISO_VENCIDO',
        mensaje: `Compromiso vencido: "${c.descripcion}"`,
        proyectoId: c.proyecto.id,
        proyectoNombre: c.proyecto.nombre,
        nivel: 'CRITICA',
      })
    }

    for (const e of entregablesVencidos) {
      alertas.push({
        tipo: 'ENTREGABLE_VENCIDO',
        mensaje: `Entregable vencido: "${e.nombre}"`,
        proyectoId: e.proyecto.id,
        proyectoNombre: e.proyecto.nombre,
        nivel: 'CRITICA',
      })
    }

    for (const p of polizasPendientes) {
      alertas.push({
        tipo: 'POLIZA_PENDIENTE',
        mensaje: 'El proyecto requiere póliza pero no ha sido contratada',
        proyectoId: p.id,
        proyectoNombre: p.nombre,
        nivel: 'CRITICA',
      })
    }

    for (const p of contratosPendientes) {
      alertas.push({
        tipo: 'CONTRATO_PENDIENTE',
        mensaje: 'Propuesta aprobada hace más de 3 días pero el contrato no ha sido firmado',
        proyectoId: p.id,
        proyectoNombre: p.nombre,
        nivel: 'CRITICA',
      })
    }

    for (const p of propuestasSinAprobacion) {
      alertas.push({
        tipo: 'PROPUESTA_SIN_APROBAR',
        mensaje: 'Proyecto en propuesta hace más de 7 días sin aprobar',
        proyectoId: p.id,
        proyectoNombre: p.nombre,
        nivel: 'MEDIA',
      })
    }

    for (const p of sinKickoff) {
      alertas.push({
        tipo: 'SIN_KICKOFF',
        mensaje: 'Contrato firmado hace más de 3 días sin kick-off realizado',
        proyectoId: p.id,
        proyectoNombre: p.nombre,
        nivel: 'MEDIA',
      })
    }

    for (const p of kickoffSinRealizar) {
      alertas.push({
        tipo: 'KICKOFF_PENDIENTE',
        mensaje: 'Proyecto en Kick-off hace más de 5 días sin realizarlo',
        proyectoId: p.id,
        proyectoNombre: p.nombre,
        nivel: 'MEDIA',
      })
    }

    for (const e of entregablesProximosSinAprobar) {
      alertas.push({
        tipo: 'ENTREGABLE_PROXIMO_SIN_APROBAR',
        mensaje: `Entregable próximo sin aprobación del cliente: "${e.nombre}"`,
        proyectoId: e.proyecto.id,
        proyectoNombre: e.proyecto.nombre,
        nivel: 'MEDIA',
      })
    }

    for (const pc of cuotasVencidas) {
      alertas.push({
        tipo: 'CUOTA_VENCIDA',
        mensaje: `Cuota #${pc.numeroCuota} vencida sin recibir: "${pc.descripcion}"`,
        proyectoId: pc.proyecto.id,
        proyectoNombre: pc.proyecto.nombre,
        nivel: 'CRITICA',
      })
    }

    for (const f of facturasSinFecha) {
      alertas.push({
        tipo: 'FACTURA_SIN_FECHA_PAGO',
        mensaje: `Factura #${f.numero} aprobada sin fecha programada de pago`,
        proyectoId: f.proyecto.id,
        proyectoNombre: f.proyecto.nombre,
        nivel: 'MEDIA',
      })
    }

    for (const f of pagosVencidos) {
      alertas.push({
        tipo: 'PAGO_VENCIDO',
        mensaje: `Pago programado de factura #${f.numero} venció sin ejecutarse`,
        proyectoId: f.proyecto.id,
        proyectoNombre: f.proyecto.nombre,
        nivel: 'CRITICA',
      })
    }

    for (const f of confirmacionesPendientes) {
      alertas.push({
        tipo: 'CONFIRMACION_PENDIENTE',
        mensaje: `Factura #${f.numero} ejecutada pendiente de confirmación financiera`,
        proyectoId: f.proyecto.id,
        proyectoNombre: f.proyecto.nombre,
        nivel: 'MEDIA',
      })
    }

    for (const p of proyectosSinCuotas) {
      alertas.push({
        tipo: 'PROYECTO_SIN_CUOTAS',
        mensaje: 'Proyecto activo sin cuotas de pago registradas',
        proyectoId: p.id,
        proyectoNombre: p.nombre,
        nivel: 'MEDIA',
      })
    }

    return alertas
  }
}
