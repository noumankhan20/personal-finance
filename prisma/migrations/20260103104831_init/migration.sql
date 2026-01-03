/*
  Warnings:

  - The values [loan_receivable,loan_payable] on the enum `AccountType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `name` on the `Account` table. All the data in the column will be lost.
  - Added the required column `accountname` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AccountType_new" AS ENUM ('bank', 'cash', 'credit_card', 'investment');
ALTER TABLE "Account" ALTER COLUMN "accountType" TYPE "AccountType_new" USING ("accountType"::text::"AccountType_new");
ALTER TYPE "AccountType" RENAME TO "AccountType_old";
ALTER TYPE "AccountType_new" RENAME TO "AccountType";
DROP TYPE "public"."AccountType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "name",
ADD COLUMN     "accountname" TEXT NOT NULL;
