-- CreateEnum
CREATE TYPE "BeneficiaryType" AS ENUM ('BANK', 'INTERNAL_WALLET');

-- CreateEnum
CREATE TYPE "BeneficiaryStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'BLOCKED');

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "type" "BeneficiaryType" NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "accountHolderName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "bankName" TEXT,
    "linkedUserId" TEXT,
    "status" "BeneficiaryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Beneficiary_merchantId_idx" ON "Beneficiary"("merchantId");

-- CreateIndex
CREATE INDEX "Beneficiary_status_idx" ON "Beneficiary"("status");

-- CreateIndex
CREATE INDEX "Beneficiary_createdAt_idx" ON "Beneficiary"("createdAt");

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
