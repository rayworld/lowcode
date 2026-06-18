-- CreateTable
CREATE TABLE "OptionSet" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OptionSet_appId_name_key" ON "OptionSet"("appId", "name");

-- AddForeignKey
ALTER TABLE "OptionSet" ADD CONSTRAINT "OptionSet_appId_fkey" FOREIGN KEY ("appId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Field" ADD COLUMN "optionSetId" TEXT;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_optionSetId_fkey" FOREIGN KEY ("optionSetId") REFERENCES "OptionSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
