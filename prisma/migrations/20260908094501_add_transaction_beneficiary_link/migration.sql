-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "beneficiaryId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_beneficiaryId_idx" ON "Transaction"("beneficiaryId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
