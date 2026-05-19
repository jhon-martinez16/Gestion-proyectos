import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CrearReunionDto } from './dto/crear-reunion.dto'
import { ActualizarReunionDto } from './dto/actualizar-reunion.dto'

@Injectable()
export class ReunionesService {
  constructor(private prisma: PrismaService) {}

  private async verificarAcceso(proyectoId: string, usuario: { sub: string; rol: string }) {
    if (usuario.rol === 'ADMIN') return
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { liderId: true, socio2Id: true },
    })
    if (!proyecto || (proyecto.liderId !== usuario.sub && proyecto.socio2Id !== usuario.sub)) {
      throw new ForbiddenException('Solo el líder o socio2 del proyecto pueden gestionar sus reuniones')
    }
  }

  async crear(dto: CrearReunionDto, usuario: { sub: string; rol: string }) {
    await this.verificarAcceso(dto.proyectoId, usuario)

    const reunion = await this.prisma.reunionSeguimiento.create({
      data: {
        fecha: new Date(dto.fecha),
        objetivos: dto.objetivos,
        proximospasos: dto.proximospasos,
        proximaReunion: dto.proximaReunion ? new Date(dto.proximaReunion) : null,
        proyectoId: dto.proyectoId,
      },
    })

    await this.prisma.historialProyecto.create({
      data: {
        proyectoId: dto.proyectoId,
        accion: 'REUNION_CREADA',
        detalle: `Reunión de seguimiento registrada para ${new Date(dto.fecha).toLocaleDateString('es-CO')}`,
      },
    })

    return reunion
  }

  async listarPorProyecto(proyectoId: string) {
    return this.prisma.reunionSeguimiento.findMany({
      where: { proyectoId },
      include: { compromisos: true },
      orderBy: { fecha: 'desc' },
    })
  }

  async obtenerPorId(id: string) {
    const reunion = await this.prisma.reunionSeguimiento.findUnique({
      where: { id },
      include: { compromisos: true },
    })

    if (!reunion) {
      throw new NotFoundException('Reunión no encontrada')
    }

    return reunion
  }

  async actualizar(id: string, dto: ActualizarReunionDto, usuario: { sub: string; rol: string }) {
    const reunion = await this.obtenerPorId(id)
    await this.verificarAcceso(reunion.proyectoId, usuario)

    const data: Record<string, unknown> = {}
    if (dto.fecha !== undefined) data.fecha = new Date(dto.fecha)
    if (dto.objetivos !== undefined) data.objetivos = dto.objetivos
    if (dto.proximospasos !== undefined) data.proximospasos = dto.proximospasos
    if (dto.calidadAprobada !== undefined) data.calidadAprobada = dto.calidadAprobada
    if (dto.proximaReunion !== undefined) {
      data.proximaReunion = dto.proximaReunion ? new Date(dto.proximaReunion) : null
    }

    const actualizada = await this.prisma.reunionSeguimiento.update({
      where: { id },
      data,
      include: { compromisos: true },
    })

    if (dto.calidadAprobada === true && !reunion.calidadAprobada) {
      await this.prisma.historialProyecto.create({
        data: {
          proyectoId: reunion.proyectoId,
          accion: 'REUNION_CALIDAD_APROBADA',
          detalle: `Calidad aprobada en reunión del ${new Date(reunion.fecha).toLocaleDateString('es-CO')}`,
        },
      })
    }

    return actualizada
  }

  async listarProximas() {
    const hoy = new Date()
    const en30Dias = new Date()
    en30Dias.setDate(hoy.getDate() + 30)
    return this.prisma.reunionSeguimiento.findMany({
      where: {
        proximaReunion: { gte: hoy, lte: en30Dias },
      },
      select: {
        id: true,
        proximaReunion: true,
        proyecto: { select: { id: true, nombre: true } },
      },
      orderBy: { proximaReunion: 'asc' },
      take: 5,
    })
  }

  async eliminar(id: string, usuario: { sub: string; rol: string }) {
    const reunion = await this.obtenerPorId(id)
    await this.verificarAcceso(reunion.proyectoId, usuario)

    await this.prisma.reunionSeguimiento.delete({ where: { id } })

    return { mensaje: 'Reunión eliminada correctamente' }
  }
}
