import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import {
  EstadoProyecto,
  EstadoCompromiso,
  EstadoEntregable,
} from '@prisma/client'

@Injectable()
export class EvaluadorProyectoService {
  constructor(private prisma: PrismaService) {}

  // =========================================
  // MÉTODO ORIGINAL - NO SE TOCA
  // =========================================
  async actualizarEstado(proyectoId: string) {
    const hoy = new Date()

    const [
      compromisosNoCumplidos,
      compromisosVencidos,
      entregablesVencidos,
      entregablesUrgentes,
    ] = await Promise.all([
      this.prisma.compromiso.count({
        where: {
          proyectoId,
          estado: EstadoCompromiso.NO_CUMPLIDO,
        },
      }),

      this.prisma.compromiso.count({
        where: {
          proyectoId,
          estado: EstadoCompromiso.PENDIENTE,
          fechaActual: { lt: hoy },
        },
      }),

      this.prisma.entregable.count({
        where: {
          proyectoId,
          estado: EstadoEntregable.VENCIDO,
        },
      }),

      this.prisma.entregable.count({
        where: {
          proyectoId,
          estado: EstadoEntregable.URGENTE,
        },
      }),
    ])

    let nuevoEstado: EstadoProyecto = EstadoProyecto.EN_CURSO

    if (compromisosNoCumplidos > 0 || entregablesVencidos > 0) {
      nuevoEstado = EstadoProyecto.EN_RIESGO
    } else if (compromisosVencidos >= 2 || entregablesUrgentes > 0) {
      nuevoEstado = EstadoProyecto.ADVERTENCIA
    }

    await this.prisma.proyecto.update({
      where: { id: proyectoId },
      data: { estado: nuevoEstado },
    })

    await this.prisma.historialProyecto.create({
      data: {
        accion: 'EVALUACION_AUTOMATICA',
        detalle: `Estado actualizado a ${nuevoEstado}`,
        proyectoId,
      },
    })

    return nuevoEstado
  }

  // =========================================
  // MÉTODO ORIGINAL - DEVUELVE LISTA
  // =========================================
  async obtenerAdvertenciasProyecto(proyectoId: string) {
    const hoy = new Date()

    const [compromisos, entregables] = await Promise.all([
      this.prisma.compromiso.findMany({
        where: { proyectoId },
      }),
      this.prisma.entregable.findMany({
        where: { proyectoId },
      }),
    ])

    const advertencias: any[] = []

    for (const c of compromisos) {
      if (
        c.estado === EstadoCompromiso.PENDIENTE &&
        c.fechaActual <= hoy
      ) {
        advertencias.push({
          tipo: 'COMPROMISO_VENCIDO',
          nivel: 'CRITICA',
          mensaje: 'Compromiso vencido',
        })
      }

      if (c.estado === EstadoCompromiso.NO_CUMPLIDO) {
        advertencias.push({
          tipo: 'COMPROMISO_NO_CUMPLIDO',
          nivel: 'CRITICA',
          mensaje: 'Compromiso no cumplido',
        })
      }
    }

    for (const e of entregables) {
      if (e.estado === EstadoEntregable.VENCIDO) {
        advertencias.push({
          tipo: 'ENTREGABLE_VENCIDO',
          nivel: 'CRITICA',
          mensaje: 'Entregable vencido',
        })
      }

      if (e.estado === EstadoEntregable.URGENTE) {
        advertencias.push({
          tipo: 'ENTREGABLE_URGENTE',
          nivel: 'MEDIA',
          mensaje: 'Entregable urgente',
        })
      }
    }

    return advertencias
  }

  // =========================================
  // NUEVO MÉTODO PROFESIONAL (NO ROMPE NADA)
  // =========================================
  async evaluarProyectoCompleto(proyectoId: string) {
    const hoy = new Date()

    const [compromisos, entregables] = await Promise.all([
      this.prisma.compromiso.findMany({
        where: { proyectoId },
      }),
      this.prisma.entregable.findMany({
        where: { proyectoId },
      }),
    ])

    let totalVencidos = 0
    let totalProximos = 0
    let estado: EstadoProyecto = EstadoProyecto.EN_CURSO

    for (const c of compromisos) {
      if (c.estado === EstadoCompromiso.NO_CUMPLIDO) {
        totalVencidos++
      }

      if (
        c.estado === EstadoCompromiso.PENDIENTE &&
        c.fechaActual <= hoy
      ) {
        totalVencidos++
      }
    }

    for (const e of entregables) {
      if (e.estado === EstadoEntregable.VENCIDO) {
        totalVencidos++
      }

      if (e.estado === EstadoEntregable.URGENTE) {
        totalProximos++
      }
    }

    // MISMA LÓGICA QUE actualizarEstado 
    if (totalVencidos > 0) {
      estado = EstadoProyecto.EN_RIESGO
    } else if (totalProximos > 0) {
      estado = EstadoProyecto.ADVERTENCIA
    }

    return {
      estado,
      totalVencidos,
      totalProximos,
    }
  }
}