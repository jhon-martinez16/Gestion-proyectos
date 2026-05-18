import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'

import { PrismaModule } from './prisma/prisma.module'
import { CategoriasModule } from './modules/categorias/categorias.module'
import { CompromisosModule } from './modules/compromisos/compromisos.module'
import { EvaluadorProyectoService } from './common/services/evaluador-proyecto.service'
import { VerificadorCompromisosService } from './common/services/verificador-compromisos.service'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { ProyectosModule } from './modules/proyectos/proyectos.module'
import { CommonModule } from './common/common.module'
import { UsuariosModule } from './modules/usuarios/usuarios.module'
import { EntregablesModule } from './modules/entregables/entregables.module'
import { AuthModule } from './auth/auth.module'
import { ReunionesModule } from './modules/reuniones/reuniones.module'
import { AlertasModule } from './modules/alertas/alertas.module'
import { FacturasModule } from './modules/facturas/facturas.module'
import { ProveedoresModule } from './modules/proveedores/proveedores.module'
import { FeedbackModule } from './modules/feedback/feedback.module'
import { PagosClienteModule } from './modules/pagos-cliente/pagos-cliente.module'
import { NotasModule } from './modules/notas/notas.module'
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module'
import { CronogramaModule } from './modules/cronograma/cronograma.module'
import { ReportesModule } from './modules/reportes/reportes.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    PrismaModule,
    CategoriasModule,
    CompromisosModule,
    DashboardModule,
    ProyectosModule,
    CommonModule,
    UsuariosModule,
    EntregablesModule,
    AuthModule,
    ReunionesModule,
    AlertasModule,
    FacturasModule,
    ProveedoresModule,
    FeedbackModule,
    PagosClienteModule,
    NotasModule,
    NotificacionesModule,
    CronogramaModule,
    ReportesModule,
  ],
  providers: [EvaluadorProyectoService, VerificadorCompromisosService],
  exports: [EvaluadorProyectoService, VerificadorCompromisosService],
})
export class AppModule {}