/*
  Warnings:

  - You are about to drop the column `userId` on the `Loan` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Loan_userId_idx";

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "userId";
