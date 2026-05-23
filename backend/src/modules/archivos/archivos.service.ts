import { BadRequestException, Injectable } from '@nestjs/common'
import * as path from 'path'
import * as fs from 'fs'

const CARPETAS_PERMITIDAS = ['facturas', 'recibos', 'general', 'entregables']
const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

@Injectable()
export class ArchivosService {
  async guardarArchivo(file: Express.Multer.File, carpeta: string): Promise<string> {
    if (!CARPETAS_PERMITIDAS.includes(carpeta)) {
      throw new BadRequestException(`Carpeta no permitida: ${carpeta}`)
    }
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido. Solo PDF, JPG o PNG.')
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('El archivo supera el tamaño máximo de 10 MB.')
    }

    const dir = path.join(process.cwd(), 'uploads', carpeta)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const ext = path.extname(file.originalname).toLowerCase()
    const nombre = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const rutaAbsoluta = path.join(dir, nombre)

    fs.writeFileSync(rutaAbsoluta, file.buffer)

    return `uploads/${carpeta}/${nombre}`
  }
}
