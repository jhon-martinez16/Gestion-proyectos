-- CreateEnum
CREATE TYPE "PagoEstado" AS ENUM ('PENDIENTE', 'RECIBIDO', 'VENCIDO', 'PARCIAL');

-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "comprobantePagoPath" TEXT,
ADD COLUMN     "confirmacionFinanciera" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fechaPagoEjecutado" TIMESTAMP(3),
ADD COLUMN     "fechaProgramadaPago" TIMESTAMP(3),
ADD COLUMN     "pagoEjecutado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PagoCliente" (
    "id" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "montoEsperado" DECIMAL(65,30) NOT NULL,
    "montoRecibido" DECIMAL(65,30),
    "fechaEsperada" TIMESTAMP(3) NOT NULL,
    "fechaRecibido" TIMESTAMP(3),
    "estado" "PagoEstado" NOT NULL DEFAULT 'PENDIENTE',
    "comprobantePath" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proyectoId" TEXT NOT NULL,

    CONSTRAINT "PagoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaProyecto" (
    "id" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proyectoId" TEXT NOT NULL,

    CONSTRAINT "NotaProyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificacionInterna" (
    "id" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioDestinoId" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,

    CONSTRAINT "NotificacionInterna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CronogramaVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "descripcionCambios" TEXT NOT NULL,
    "aprobadoCliente" BOOLEAN NOT NULL DEFAULT false,
    "fechaAprobacion" TIMESTAMP(3),
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proyectoId" TEXT NOT NULL,

    CONSTRAINT "CronogramaVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotaProyecto_proyectoId_key" ON "NotaProyecto"("proyectoId");

-- AddForeignKey
ALTER TABLE "PagoCliente" ADD CONSTRAINT "PagoCliente_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaProyecto" ADD CONSTRAINT "NotaProyecto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionInterna" ADD CONSTRAINT "NotificacionInterna_usuarioDestinoId_fkey" FOREIGN KEY ("usuarioDestinoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionInterna" ADD CONSTRAINT "NotificacionInterna_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CronogramaVersion" ADD CONSTRAINT "CronogramaVersion_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
