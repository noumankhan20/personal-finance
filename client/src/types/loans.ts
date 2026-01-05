export type LoanType = "GIVEN" | "TAKEN";
export type InterestType = "SIMPLE" | "COMPOUND";
export type RepaymentType = "PRINCIPAL" | "INTEREST";

export interface LoanRepayment {
  id: string;
  loanId: string;
  amount: number;
  repaymentType: RepaymentType;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  personName: string;
  loanType: LoanType;
  principal: number;
  interestRate: number;
  interestType: InterestType;
  startDate: string;
  notes?: string;
  repayments: LoanRepayment[];
  createdAt: string;
  updatedAt: string;
}
