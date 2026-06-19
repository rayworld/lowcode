-- CreateTable
CREATE TABLE "UserAppRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserAppRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- AddForeignKey
ALTER TABLE "UserAppRole" ADD CONSTRAINT "UserAppRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAppRole" ADD CONSTRAINT "UserAppRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AppRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
