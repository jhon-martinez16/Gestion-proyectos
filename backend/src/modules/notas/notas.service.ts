import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class NotasService {
  constructor(private prisma: PrismaService) {}

  async obtener(proyectoId: string) {
    return this.prisma.notaProyecto.findUnique({ where: { proyectoId } })
  }

  async upsert(proyectoId: string, contenido: string, usuario: { sub: string }) {
    return this.prisma.notaProyecto.upsert({
      where: { proyectoId },
      create: { proyectoId, contenido, creadoPorId: usuario.sub },
      update: { contenido },
    })
  }
}
