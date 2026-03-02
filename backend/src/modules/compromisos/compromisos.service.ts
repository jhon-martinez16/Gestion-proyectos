import {
  Injectable,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import {
  EstadoCompromiso,
} from '@prisma/client'
import { CrearCompromisoDto } from './dto/crear-compromiso.dto'
import {
  ResolverCompromisoDto,
  DecisionCompromiso,
} from './dto/resolver-compromiso.dto'
import { EvaluadorProyectoService } from 'src/common/services/evaluador-proyecto.service'

@Injectable()
export class CompromisosService {
  constructor(
    private prisma: PrismaService,
    private evaluador: EvaluadorProyectoService,
  ) {}

  //  CREAR COMPROMISO
  async crear(dto: CrearCompromisoDto) {
    const fecha = new Date(dto.fecha)

    const creado = await this.prisma.compromiso.create({
      data: {
        descripcion: dto.descripcion,
        fechaOriginal: fecha,
        fechaActual: fecha,
        proyectoId: dto.proyectoId,
        responsableId: dto.responsableId ?? null,
      },
    })

    // recalcula estado del proyecto
    await this.evaluador.actualizarEstado(dto.proyectoId)

    return creado
  }
  // LISTAR TOD (DASHBOARD)
  async listarTodos() {
  return this.prisma.compromiso.findMany({
    orderBy: { fechaActual: 'asc' },
  })
  }

  //  OBTENER COMPROMISOS VENCIDOS
  async obtenerVencidos(proyectoId: string) {
    const hoy = new Date()

    return this.prisma.compromiso.findMany({
      where: {
        proyectoId,
        estado: EstadoCompromiso.PENDIENTE,
        fechaActual: { lte: hoy },
      },
      orderBy: { fechaActual: 'asc' },
    })
  }

  // LISTAR COMPROMISOS
  async listarPorProyecto(proyectoId: string) {
  return this.prisma.compromiso.findMany({
    where: { proyectoId },
    orderBy: { fechaActual: 'asc' },
  })
}
  //  RESOLVER COMPROMISO (FLUJO OBLIGATORIO DEL SISTEMA)
  async resolver(id: string, dto: ResolverCompromisoDto) {
    const compromiso = await this.prisma.compromiso.findUnique({
      where: { id },
    })

    if (!compromiso) {
      throw new BadRequestException('Compromiso no existe')
    }

    // ==============================
    //  CUMPLIDO
    // ==============================
    if (dto.decision === DecisionCompromiso.CUMPLIDO) {
      const actualizado = await this.prisma.compromiso.update({
        where: { id },
        data: {
          estado: EstadoCompromiso.CUMPLIDO,
        },
      })

      await this.evaluador.actualizarEstado(compromiso.proyectoId)
      return actualizado
    }

    // ==============================
    //  NO CUMPLIDO → crea nuevo obligatorio
    // ==============================
    if (dto.decision === DecisionCompromiso.NO_CUMPLIDO) {
      if (!dto.comentario) {
        throw new BadRequestException('Comentario obligatorio')
      }

      if (!dto.nuevaFecha || !dto.nuevaDescripcion) {
        throw new BadRequestException(
          'Debe crear nuevo compromiso obligatorio',
        )
      }

      await this.prisma.compromiso.update({
        where: { id },
        data: {
          estado: EstadoCompromiso.NO_CUMPLIDO,
          comentario: dto.comentario,
        },
      })

      const nuevo = await this.prisma.compromiso.create({
        data: {
          descripcion: dto.nuevaDescripcion,
          fechaOriginal: new Date(dto.nuevaFecha),
          fechaActual: new Date(dto.nuevaFecha),
          proyectoId: compromiso.proyectoId,
        },
      })

      await this.evaluador.actualizarEstado(compromiso.proyectoId)
      return nuevo
    }

    // ==============================
    //  REPROGRAMAR
    // =============================
    if (dto.decision === DecisionCompromiso.REPROGRAMAR) {
      if (!dto.nuevaFecha) {
        throw new BadRequestException('Debe indicar nueva fecha')
      }

      const actualizado = await this.prisma.compromiso.update({
        where: { id },
        data: {
          estado: EstadoCompromiso.REPROGRAMADO,
          fechaActual: new Date(dto.nuevaFecha),
        },
      })

      await this.evaluador.actualizarEstado(compromiso.proyectoId)
      return actualizado
    }


    
    throw new BadRequestException('Decisión inválida')
  }
}
