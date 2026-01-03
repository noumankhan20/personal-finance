export type AccountType =
  | "bank"
  | "cash"
  | "credit_card"
  | "investment";

export interface Account {
  id: string;
  accountname: string;
  accountType: AccountType;
  description: string | null;
  openingBalance: number;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountPayload {
  accountname: string;
  accountType: AccountType;
  openingBalance: number;
  description?: string;
}

export interface UpdateAccountPayload {
  id: string;
  accountname: string;
  accountType: AccountType;
  description?: string;
}
