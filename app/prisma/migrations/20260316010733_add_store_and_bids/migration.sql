-- CreateTable
CREATE TABLE "ChoreBid" (
    "id" TEXT NOT NULL,
    "choreInstanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoreBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreItem" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeItemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "parentNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChoreBid_choreInstanceId_idx" ON "ChoreBid"("choreInstanceId");

-- CreateIndex
CREATE INDEX "ChoreBid_userId_idx" ON "ChoreBid"("userId");

-- CreateIndex
CREATE INDEX "ChoreBid_status_idx" ON "ChoreBid"("status");

-- CreateIndex
CREATE INDEX "StoreItem_familyId_idx" ON "StoreItem"("familyId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_userId_idx" ON "PurchaseRequest"("userId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");

-- AddForeignKey
ALTER TABLE "ChoreBid" ADD CONSTRAINT "ChoreBid_choreInstanceId_fkey" FOREIGN KEY ("choreInstanceId") REFERENCES "ChoreInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreBid" ADD CONSTRAINT "ChoreBid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreItem" ADD CONSTRAINT "StoreItem_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_storeItemId_fkey" FOREIGN KEY ("storeItemId") REFERENCES "StoreItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
