import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as dotenv from 'dotenv'
import * as path from 'path'
import helmet from 'helmet'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression')

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Serve uploaded files at /uploads/<carpeta>/<filename>
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), { prefix: '/uploads' })

  app.use(helmet())
  app.use(compression())

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  await app.listen(process.env.PORT || 3000)
}
bootstrap()