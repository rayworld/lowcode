-- AlterTable
ALTER TABLE "DataEntity" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DataRecord" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DataEntity_appId_deletedAt_idx" ON "DataEntity"("appId", "deletedAt");

-- CreateIndex
CREATE INDEX "DataRecord_entityId_deletedAt_idx" ON "DataRecord"("entityId", "deletedAt");
