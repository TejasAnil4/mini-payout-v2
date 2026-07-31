-- CreateIndex
CREATE INDEX "TopUpRequest_userId_status_createdAt_idx" ON "TopUpRequest"("userId", "status", "createdAt");
