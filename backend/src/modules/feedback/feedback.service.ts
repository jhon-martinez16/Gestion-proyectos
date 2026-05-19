import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CrearFeedbackDto } from './dto/crear-feedback.dto'

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearFeedbackDto, usuario: { sub: string; rol: string }) {
    if (usuario.rol !== 'ADMIN' && usuario.rol !== 'SOCIO') {
      throw new ForbiddenException('Solo ADMIN y SOCIO pueden crear feedback')
    }

    const proyecto = await this.prisma.proyecto.findUnique({ where: { id: dto.proyectoId } })
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado')

    return this.prisma.feedbackInterno.create({
      data: {
        proyectoId: dto.proyectoId,
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        accionesTomadas: dto.accionesTomadas,
        creadoPor: usuario.sub,
      },
    })
  }

  async listarPorProyecto(proyectoId: string, usuario: { sub: string; rol: string }) {
    if (usuario.rol !== 'ADMIN' && usuario.rol !== 'SOCIO') {
      throw new ForbiddenException('Solo ADMIN y SOCIO pueden ver el feedback interno')
    }

    return this.prisma.feedbackInterno.findMany({
      where: { proyectoId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async eliminar(id: string, usuario: { sub: string; rol: string }) {
    if (usuario.rol !== 'ADMIN') {
      throw new ForbiddenException('Solo ADMIN puede eliminar feedback')
    }
    const feedback = await this.prisma.feedbackInterno.findUnique({ where: { id } })
    if (!feedback) throw new NotFoundException('Feedback no encontrado')
    await this.prisma.feedbackInterno.delete({ where: { id } })
    return { mensaje: 'Feedback eliminado' }
  }
}
