-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('income', 'expense', 'transfer');

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "entryType" "EntryType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT,
    "linkedLoanId" TEXT,
    "transferGroupId" TEXT,
    "counterAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Entry_entryType_idx" ON "Entry"("entryType");

-- CreateIndex
CREATE INDEX "Entry_date_idx" ON "Entry"("date");

-- CreateIndex
CREATE INDEX "Entry_accountId_idx" ON "Entry"("accountId");

-- CreateIndex
CREATE INDEX "Entry_categoryId_idx" ON "Entry"("categoryId");

-- CreateIndex
CREATE INDEX "Entry_transferGroupId_idx" ON "Entry"("transferGroupId");

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_linkedLoanId_fkey" FOREIGN KEY ("linkedLoanId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
