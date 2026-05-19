import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CrearEntregableDto } from './dto/crear-entregable.dto'
import { ActualizarEntregableDto } from './dto/actualizar-entregable.dto'
import { EvaluadorProyectoService } from '../../common/services/evaluador-proyecto.service'

@Injectable()
export class EntregablesService {
  constructor(
    private prisma: PrismaService,
    private evaluador: EvaluadorProyectoService,
  ) {}

  private registrarHistorial(proyectoId: string, accion: string, detalle: string) {
    return this.prisma.historialProyecto.create({
      data: { proyectoId, accion, detalle },
    })
  }

  private async verificarAccesoProyecto(proyectoId: string, usuario: { id: string; rol: string }) {
    if (usuario.rol === 'ADMIN' || usuario.rol === 'ADMINISTRATIVO') return
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { liderId: true, socio2Id: true },
    })
    if (!proyecto || (proyecto.liderId !== usuario.id && proyecto.socio2Id !== usuario.id)) {
      throw new ForbiddenException('Solo puedes operar en proyectos donde eres líder o socio')
    }
  }

  async crear(dto: CrearEntregableDto, usuario: { id: string; rol: string }) {
    await this.verificarAccesoProyecto(dto.proyectoId, usuario)
    const creado = await this.prisma.entregable.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        fechaEntrega: new Date(dto.fechaEntrega),
        proyectoId: dto.proyectoId,
      },
    })

    await Promise.all([
      this.evaluador.actualizarEstado(dto.proyectoId),
      this.registrarHistorial(
        dto.proyectoId,
        'ENTREGABLE_CREADO',
        `Entregable creado: "${dto.nombre}"`,
      ),
    ])

    return creado
  }

  async listarProximos() {
    const hoy = new Date()
    const en30Dias = new Date()
    en30Dias.setDate(hoy.getDate() + 30)
    return this.prisma.entregable.findMany({
      where: {
        estado: { not: 'COMPLETADO' as any },
        fechaEntrega: { gte: hoy, lte: en30Dias },
      },
      select: {
        id: true,
        nombre: true,
        fechaEntrega: true,
        estado: true,
        proyecto: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaEntrega: 'asc' },
      take: 10,
    })
  }

  async listarPorProyecto(proyectoId: string) {
    return this.prisma.entregable.findMany({
      where: { proyectoId },
      orderBy: { fechaEntrega: 'asc' },
    })
  }

  async obtenerPorId(id: string) {
    const entregable = await this.prisma.entregable.findUnique({ where: { id } })

    if (!entregable) {
      throw new BadRequestException('Entregable no existe')
    }

    return entregable
  }

  async actualizar(id: string, dto: ActualizarEntregableDto, usuario: { id: string; rol: string }) {
    const actual = await this.obtenerPorId(id)
    await this.verificarAccesoProyecto(actual.proyectoId, usuario)

    const data: Record<string, unknown> = {}
    if (dto.nombre !== undefined) data.nombre = dto.nombre
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion
    if (dto.fechaEntrega !== undefined) data.fechaEntrega = new Date(dto.fechaEntrega)
    if (dto.revisionInternaAprobada !== undefined) data.revisionInternaAprobada = dto.revisionInternaAprobada
    if (dto.clienteAprobado !== undefined) data.clienteAprobado = dto.clienteAprobado
    if (dto.observacionesCliente !== undefined) data.observacionesCliente = dto.observacionesCliente
    if (dto.fechaAprobacionCliente !== undefined) data.fechaAprobacionCliente = new Date(dto.fechaAprobacionCliente)
    if (dto.estado !== undefined) data.estado = dto.estado

    const actualizado = await this.prisma.entregable.update({ where: { id }, data })

    let accion = 'ENTREGABLE_ACTUALIZADO'
    let detalle = `Entregable actualizado: "${actual.nombre}"`
    if (dto.estado === 'COMPLETADO') {
      const hoy = new Date()
      const diasRetraso = Math.max(
        0,
        Math.floor((hoy.getTime() - actual.fechaEntrega.getTime()) / (1000 * 60 * 60 * 24)),
      )
      accion = 'ENTREGABLE_COMPLETADO'
      detalle =
        diasRetraso > 0
          ? `Entregable "${actual.nombre}" completado con ${diasRetraso} día${diasRetraso === 1 ? '' : 's'} de retraso`
          : `Entregable "${actual.nombre}" completado a tiempo`
    } else if (dto.fechaEntrega !== undefined && dto.motivoReprogramacion !== undefined) {
      const fechaOriginal = actual.fechaEntrega.toLocaleDateString('es-CO')
      const fechaNueva = new Date(dto.fechaEntrega).toLocaleDateString('es-CO')
      const sufijo = dto.motivoReprogramacion ? `. Motivo: ${dto.motivoReprogramacion}` : ''
      accion = 'ENTREGABLE_REPROGRAMADO'
      detalle = `Entregable "${actual.nombre}" reprogramado de ${fechaOriginal} a ${fechaNueva}${sufijo}`
    } else if (dto.revisionInternaAprobada === true) {
      accion = 'REVISION_INTERNA_APROBADA'
      detalle = `Revisión interna aprobada: "${actual.nombre}"`
    } else if (dto.clienteAprobado === true) {
      accion = 'CLIENTE_APROBO'
      detalle = `Cliente aprobó el entregable: "${actual.nombre}"`
    } else if (dto.observacionesCliente !== undefined && dto.estado === 'PENDIENTE') {
      accion = 'CLIENTE_DEVOLVIO'
      detalle = `Cliente devolvió el entregable con observaciones: "${actual.nombre}"`
    }

    await Promise.all([
      this.evaluador.actualizarEstado(actualizado.proyectoId),
      this.registrarHistorial(actualizado.proyectoId, accion, detalle),
    ])

    return actualizado
  }

  async eliminar(id: string) {
    const entregable = await this.prisma.entregable.findUnique({ where: { id } })

    if (!entregable) {
      throw new BadRequestException('Entregable no existe')
    }

    await this.prisma.entregable.delete({ where: { id } })

    await Promise.all([
      this.evaluador.actualizarEstado(entregable.proyectoId),
      this.registrarHistorial(
        entregable.proyectoId,
        'ENTREGABLE_ELIMINADO',
        `Entregable eliminado: "${entregable.nombre}"`,
      ),
    ])

    return { mensaje: 'Entregable eliminado correctamente' }
  }
}
