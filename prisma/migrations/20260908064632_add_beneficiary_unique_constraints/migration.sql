/*
  Warnings:

  - A unique constraint covering the columns `[merchantId,accountNumber,ifscCode]` on the table `Beneficiary` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[merchantId,linkedUserId]` on the table `Beneficiary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Beneficiary_merchantId_accountNumber_ifscCode_key" ON "Beneficiary"("merchantId", "accountNumber", "ifscCode");

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiary_merchantId_linkedUserId_key" ON "Beneficiary"("merchantId", "linkedUserId");
