-- AlterTable
ALTER TABLE "OrderStatusHistory" ADD COLUMN     "businessId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "businessId" TEXT;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "businessId" TEXT;

-- CreateIndex
CREATE INDEX "OrderStatusHistory_businessId_idx" ON "OrderStatusHistory"("businessId");

-- CreateIndex
CREATE INDEX "PurchaseItem_businessId_idx" ON "PurchaseItem"("businessId");

-- CreateIndex
CREATE INDEX "SaleItem_businessId_idx" ON "SaleItem"("businessId");

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
