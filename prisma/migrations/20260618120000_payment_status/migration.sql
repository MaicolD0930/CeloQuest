-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'confirmed';

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
