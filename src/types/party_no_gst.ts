export interface Party {
  id?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  panNumber?: string;
  businessType: 'B2B' | 'B2C' | 'Supplier' | 'Customer';
  isActive: boolean;
  
  // Financial Information
  creditLimit?: number;
  outstandingBalance?: number;
  paymentTerms?: string;
  
  // Additional Information
  notes?: string;
  tags?: string[];
  preferredCategories?: string[];
  
  // System Fields
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  userId?: string;
}

export interface PartyFormData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  panNumber?: string;
  businessType: 'B2B' | 'B2C' | 'Supplier' | 'Customer';
  isActive: boolean;
  creditLimit?: number;
  outstandingBalance?: number;
  paymentTerms?: string;
  notes?: string;
  tags?: string[];
  preferredCategories?: string[];
  userId?: string;
}

export interface PartyFilters {
  businessType?: string;
  isActive?: boolean;
  searchTerm?: string;
  tags?: string[];
  creditLimitFrom?: number;
  creditLimitTo?: number;
  outstandingBalanceFrom?: number;
  outstandingBalanceTo?: number;
}

export interface PartyStatistics {
  totalParties: number;
  activeParties: number;
  inactiveParties: number;
  totalOutstanding: number;
  totalCreditLimit: number;
  businessTypeBreakdown: {
    B2B: number;
    B2C: number;
    Supplier: number;
    Customer: number;
  };
  topParties: Array<{
    partyId: string;
    partyName: string;
    totalTransactions: number;
    totalAmount: number;
    outstandingBalance: number;
  }>;
}