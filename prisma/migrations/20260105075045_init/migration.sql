-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('GIVEN', 'TAKEN');

-- CreateEnum
CREATE TYPE "InterestType" AS ENUM ('SIMPLE', 'COMPOUND');

-- CreateEnum
CREATE TYPE "RepaymentType" AS ENUM ('PRINCIPAL', 'INTEREST');

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "loanType" "LoanType" NOT NULL,
    "principal" DECIMAL(14,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL,
    "interestType" "InterestType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanRepayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "repaymentType" "RepaymentType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Loan_userId_idx" ON "Loan"("userId");

-- CreateIndex
CREATE INDEX "LoanRepayment_loanId_idx" ON "LoanRepayment"("loanId");

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
