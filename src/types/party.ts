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
  preferredPaymentMethod?: 'Cash' | 'Cheque' | 'Bank Transfer' | 'UPI' | 'Card';
  
  // Additional business details
  website?: string;
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
  };
  
  // Additional Information
  notes?: string;
  tags?: string[];
  categoryDiscounts?: Record<string, number>;
  productDiscounts?: Record<string, number>;
  
  // System Fields
  createdAt?: string;
  updatedAt?: string;
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
  preferredPaymentMethod?: 'Cash' | 'Cheque' | 'Bank Transfer' | 'UPI' | 'Card';
  website?: string;
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
  };
  notes?: string;
  tags?: string[];
  // categoryDiscounts can be legacy number or new object { discount: number, dp?: number }
  categoryDiscounts?: Record<string, number | { discount: number; dp?: number }>;
  productDiscounts?: Record<string, number>;
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