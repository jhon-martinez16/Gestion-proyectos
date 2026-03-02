import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CrearProyectoDto } from './dto/crear-proyecto.dto'
import { ActualizarProyectoDto } from './dto/actualizar-proyecto.dto'
import { EvaluadorProyectoService } from 'src/common/services/evaluador-proyecto.service'

@Injectable()
export class ProyectosService {
  constructor(
    private prisma: PrismaService,
    private evaluador: EvaluadorProyectoService,
  ) {}

  async crear(dto: CrearProyectoDto) {
    const proyecto = await this.prisma.proyecto.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
        categoriaId: dto.categoriaId,
        liderId: dto.liderId,
        socio2Id: dto.socio2Id,
      },
    })

    await this.prisma.historialProyecto.create({
      data: {
        accion: 'CREACION',
        detalle: 'Proyecto creado',
        proyectoId: proyecto.id,
      },
    })

    return proyecto
  }

  async listar() {
    return this.prisma.proyecto.findMany({
      include: {
        categoria: true,
        lider: true,
        socio2: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async obtenerPorId(id: string) {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id },
      include: {
        categoria: true,
        lider: true,
        socio2: true,
        compromisos: true,
        entregables: true,
        historial: true,
      },
    })

    if (!proyecto) {
      throw new NotFoundException('Proyecto no existe')
    }

    return proyecto
  }

  async actualizar(id: string, dto: ActualizarProyectoDto) {
    const existente = await this.prisma.proyecto.findUnique({
      where: { id },
    })

    if (!existente) {
      throw new NotFoundException('Proyecto no existe')
    }

    const actualizado = await this.prisma.proyecto.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
      },
    })

    await this.prisma.historialProyecto.create({
      data: {
        accion: 'ACTUALIZACION',
        detalle: 'Proyecto actualizado',
        proyectoId: id,
      },
    })

    await this.evaluador.actualizarEstado(id)

    return actualizado
  }

  async eliminar(id: string) {
    const existente = await this.prisma.proyecto.findUnique({
      where: { id },
    })

    if (!existente) {
      throw new NotFoundException('Proyecto no existe')
    }

    await this.prisma.proyecto.delete({
      where: { id },
    })

    return { mensaje: 'Proyecto eliminado correctamente' }
  }

  // 🔥 MÉTODO CORREGIDO
  async obtenerTodos() {
    const proyectos = await this.prisma.proyecto.findMany({
      include: {
        categoria: true,
        lider: true,
        socio2: true,
        compromisos: true,
        entregables: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const proyectosConEstado = await Promise.all(
      proyectos.map(async (proyecto) => {
        const evaluacion =
          await this.evaluador.evaluarProyectoCompleto(proyecto.id)

        return {
          ...proyecto,
          estadoCalculado: evaluacion.estado,
          totalVencidos: evaluacion.totalVencidos,
          totalProximos: evaluacion.totalProximos,
        }
      }),
    )

    return proyectosConEstado
  }

  async historial(id: string) {
    return this.prisma.historialProyecto.findMany({
      where: { proyectoId: id },
      orderBy: { fecha: 'desc' },
    })
  }
}