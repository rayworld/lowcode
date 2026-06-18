-- CreateTable
CREATE TABLE "ModelSnapshot" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "comment" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelSnapshot_entityId_version_key" ON "ModelSnapshot"("entityId", "version");
CREATE INDEX "ModelSnapshot_entityId_idx" ON "ModelSnapshot"("entityId");

-- AddForeignKey
ALTER TABLE "ModelSnapshot" ADD CONSTRAINT "ModelSnapshot_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "DataEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
