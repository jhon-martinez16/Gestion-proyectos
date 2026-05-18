-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "proveedorId" TEXT;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
