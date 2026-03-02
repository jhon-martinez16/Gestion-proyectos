import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CrearCategoriaDto } from './dto/crear-categoria.dto'

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearCategoriaDto) {
  const existe = await this.prisma.categoria.findUnique({
    where: { nombre: dto.nombre },
  })

  if (existe) {
    throw new BadRequestException('La categoría ya existe')
  }

  const ultima = await this.prisma.categoria.aggregate({
    _max: { orden: true },
  })

  return this.prisma.categoria.create({
    data: {
      nombre: dto.nombre,
      color: dto.color || '#3B82F6', // 🔥 color por defecto
      orden: (ultima._max.orden ?? 0) + 1,
      activa: true,
    },
  })
}


  async listar() {
    return this.prisma.categoria.findMany({
      orderBy: { orden: 'asc' },
      include: {
        _count: {
          select: { proyectos: true },
        },
      },
    })
  }

  async desactivar(id: string) {
    return this.prisma.categoria.update({
      where: { id },
      data: { activa: false },
    })
  }

  async eliminar(id: string) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
      include: { proyectos: true },
    })

    if (!categoria) throw new BadRequestException('No existe')

    if (categoria.proyectos.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar categoría con proyectos',
      )
    }

    return this.prisma.categoria.delete({
      where: { id },
    })
  }
}
