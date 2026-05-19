-- CreateEnum
CREATE TYPE "TipoRiesgo" AS ENUM ('RIESGO', 'OPORTUNIDAD');

-- CreateEnum
CREATE TYPE "Probabilidad" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "Impacto" AS ENUM ('ALTO', 'MEDIO', 'BAJO');

-- CreateEnum
CREATE TYPE "EstadoRiesgo" AS ENUM ('ABIERTO', 'MITIGADO', 'MATERIALIZADO', 'DESCARTADO');

-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "archivoFacturaPath" TEXT;

-- AlterTable
ALTER TABLE "PagoCliente" ADD COLUMN     "archivoComprobantePath" TEXT;

-- AlterTable
ALTER TABLE "Proveedor" ADD COLUMN     "categoriaProveedor" TEXT;

-- AlterTable
ALTER TABLE "Proyecto" ADD COLUMN     "documentosFacturacionRecibidos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "documentosPolizaConfirmados" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proveedorValidado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RiesgoOportunidad" (
    "id" TEXT NOT NULL,
    "tipo" "TipoRiesgo" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "probabilidad" "Probabilidad" NOT NULL,
    "impacto" "Impacto" NOT NULL,
    "accionMitigacion" TEXT,
    "estado" "EstadoRiesgo" NOT NULL DEFAULT 'ABIERTO',
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proyectoId" TEXT NOT NULL,

    CONSTRAINT "RiesgoOportunidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackCliente" (
    "id" TEXT NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "fechaFeedback" TIMESTAMP(3) NOT NULL,
    "registradoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proyectoId" TEXT NOT NULL,
    "entregableId" TEXT,

    CONSTRAINT "FeedbackCliente_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RiesgoOportunidad" ADD CONSTRAINT "RiesgoOportunidad_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackCliente" ADD CONSTRAINT "FeedbackCliente_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackCliente" ADD CONSTRAINT "FeedbackCliente_entregableId_fkey" FOREIGN KEY ("entregableId") REFERENCES "Entregable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
