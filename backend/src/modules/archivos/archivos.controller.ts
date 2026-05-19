import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import { memoryStorage } from 'multer'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { ArchivosService } from './archivos.service'

@UseGuards(JwtAuthGuard)
@Controller('archivos')
export class ArchivosController {
  constructor(private readonly service: ArchivosService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('carpeta') carpeta: string = 'general',
  ) {
    const ruta = await this.service.guardarArchivo(file, carpeta)
    return { path: ruta, nombre: file.originalname }
  }

  @Get(':carpeta/:filename')
  serveFile(
    @Param('carpeta') carpeta: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = path.join(process.cwd(), 'uploads', carpeta, filename)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado' })
    }
    return res.sendFile(filePath)
  }
}
