export interface Party {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  gstin?: string;
  creditLimit?: number;
  outstandingBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export type PartyFormData = Omit<Party, 'id' | 'createdAt' | 'updatedAt'>;