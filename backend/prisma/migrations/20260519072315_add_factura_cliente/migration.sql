-- AlterTable
ALTER TABLE "PagoCliente" ADD COLUMN     "facturaClienteId" TEXT;

-- CreateTable
CREATE TABLE "FacturaCliente" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proyectoId" TEXT NOT NULL,

    CONSTRAINT "FacturaCliente_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FacturaCliente" ADD CONSTRAINT "FacturaCliente_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCliente" ADD CONSTRAINT "PagoCliente_facturaClienteId_fkey" FOREIGN KEY ("facturaClienteId") REFERENCES "FacturaCliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
