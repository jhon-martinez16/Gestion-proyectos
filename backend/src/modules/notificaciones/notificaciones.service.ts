import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class NotificacionesService {
  constructor(private prisma: PrismaService) {}

  async obtenerNoLeidas(usuarioId: string) {
    return this.prisma.notificacionInterna.findMany({
      where: { usuarioDestinoId: usuarioId, leida: false },
      include: { proyecto: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async marcarLeida(id: string, usuarioId: string) {
    return this.prisma.notificacionInterna.updateMany({
      where: { id, usuarioDestinoId: usuarioId },
      data: { leida: true },
    })
  }

  async marcarTodasLeidas(usuarioId: string) {
    return this.prisma.notificacionInterna.updateMany({
      where: { usuarioDestinoId: usuarioId, leida: false },
      data: { leida: true },
    })
  }

  async crearParaAdministrativos(proyectoId: string, mensaje: string) {
    const admins = await this.prisma.usuario.findMany({
      where: { rol: 'ADMINISTRATIVO', activo: true },
      select: { id: true },
    })
    if (admins.length === 0) return
    await this.prisma.notificacionInterna.createMany({
      data: admins.map((u) => ({
        usuarioDestinoId: u.id,
        proyectoId,
        mensaje,
      })),
    })
  }
}
