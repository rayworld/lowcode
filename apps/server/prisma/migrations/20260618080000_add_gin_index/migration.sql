-- AlterTable: Add GIN index on DataRecord.data for JSONB query performance
CREATE INDEX "DataRecord_data_idx" ON "DataRecord" USING GIN ("data");
CREATE INDEX "DataRecord_entityId_idx" ON "DataRecord" ("entityId");
