import { Injectable, ForbiddenException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { EstadoCompromiso } from '@prisma/client'

@Injectable()
export class VerificadorCompromisosService {
  constructor(private prisma: PrismaService) {}

  async validarSinVencidos(proyectoId: string) {
    const hoy = new Date()

    const vencidos = await this.prisma.compromiso.count({
      where: {
        proyectoId,
        estado: EstadoCompromiso.PENDIENTE,
        fechaActual: { lte: hoy },
      },
    })

    if (vencidos > 0) {
      throw new ForbiddenException(
        'Debe resolver compromisos vencidos antes de continuar',
      )
    }
  }
}
