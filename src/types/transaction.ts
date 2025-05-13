export type TransactionType = 'credit' | 'debit';

export interface Transaction {
  id?: string;
  partyId: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  reference?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFormData {
  partyId: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  reference?: string;
  date: string;
}

export interface PartyBalance {
  partyId: string;
  partyName: string;
  totalCredit: number;
  totalDebit: number;
  balance: number; // positive means party owes money, negative means we owe money
  lastTransactionDate?: string;
}