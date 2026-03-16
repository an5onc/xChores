-- CreateTable
CREATE TABLE "AllowanceRule" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastPaidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllowanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilySettings" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "maxDailyEarnings" DOUBLE PRECISION,
    "maxSpendingPerDay" DOUBLE PRECISION,
    "investmentApproval" BOOLEAN NOT NULL DEFAULT false,
    "investmentMaxAmount" DOUBLE PRECISION,
    "savingsInterestRate" DOUBLE PRECISION,

    CONSTRAINT "FamilySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AllowanceRule_familyId_idx" ON "AllowanceRule"("familyId");

-- CreateIndex
CREATE INDEX "AllowanceRule_userId_idx" ON "AllowanceRule"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilySettings_familyId_key" ON "FamilySettings"("familyId");

-- AddForeignKey
ALTER TABLE "AllowanceRule" ADD CONSTRAINT "AllowanceRule_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllowanceRule" ADD CONSTRAINT "AllowanceRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilySettings" ADD CONSTRAINT "FamilySettings_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
