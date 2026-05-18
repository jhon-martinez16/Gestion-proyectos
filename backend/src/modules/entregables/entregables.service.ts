import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CrearEntregableDto } from './dto/crear-entregable.dto'
import { ActualizarEntregableDto } from './dto/actualizar-entregable.dto'
import { EvaluadorProyectoService } from 'src/common/services/evaluador-proyecto.service'

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
    if (dto.revisionInternaAprobada === true) {
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
