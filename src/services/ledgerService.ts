import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where, 
  limit,
  startAfter,
  getDoc,
  writeBatch,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/firebase/config';

// Enhanced interfaces for ledger system
export interface LedgerAccount {
  id?: string;
  accountCode: string;
  accountName: string;
  accountType: 'supplier' | 'customer' | 'bank' | 'cash' | 'expense' | 'income' | 'asset' | 'liability';
  partyId?: string; // Reference to supplier/customer
  parentAccountId?: string;
  isGstApplicable: boolean;
  gstNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  creditLimit?: number;
  creditDays?: number;
  openingBalance: number;
  currentBalance: number;
  debitBalance: number;
  creditBalance: number;
  lastTransactionDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface LedgerTransaction {
  id?: string;
  transactionNumber: string;
  transactionDate: string;
  accountId: string;
  accountName: string;
  description: string;
  referenceNumber?: string;
  referenceType?: 'purchase_order' | 'sales_order' | 'invoice' | 'payment' | 'journal' | 'opening_balance';
  referenceId?: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  gstDetails?: {
    gstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    gstRate: number;
    isInterState: boolean;
  };
  tags?: string[];
  attachments?: string[];
  isReconciled: boolean;
  reconciledDate?: string;
  reconciledBy?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface LedgerSummary {
  totalAccounts: number;
  totalSuppliers: number;
  totalCustomers: number;
  totalDebitBalance: number;
  totalCreditBalance: number;
  totalTransactions: number;
  todayTransactions: number;
  pendingReconciliation: number;
}

export interface GSTLedgerEntry {
  id?: string;
  transactionId: string;
  accountId: string;
  gstType: 'input' | 'output';
  gstComponent: 'cgst' | 'sgst' | 'igst';
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
  month: number;
  year: number;
  returnPeriod: string;
  isReconciled: boolean;
  isReversed: boolean;
  reversalReason?: string;
  createdAt: string;
}

export interface AccountStatement {
  account: LedgerAccount;
  transactions: LedgerTransaction[];
  summary: {
    openingBalance: number;
    totalDebits: number;
    totalCredits: number;
    closingBalance: number;
    transactionCount: number;
  };
}

class LedgerService {
  private accountsCollection = collection(db, 'ledger_accounts');
  private transactionsCollection = collection(db, 'ledger_transactions');
  private gstLedgerCollection = collection(db, 'gst_ledger');

  // Account Management
  async createAccount(accountData: Omit<LedgerAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const newAccount: LedgerAccount = {
        ...accountData,
        accountCode: accountData.accountCode || await this.generateAccountCode(accountData.accountType),
        currentBalance: accountData.openingBalance,
        debitBalance: accountData.openingBalance > 0 ? accountData.openingBalance : 0,
        creditBalance: accountData.openingBalance < 0 ? Math.abs(accountData.openingBalance) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(this.accountsCollection, newAccount);

      // Create opening balance entry if not zero
      if (accountData.openingBalance !== 0) {
        await this.createTransaction({
          transactionNumber: await this.generateTransactionNumber(),
          transactionDate: new Date().toISOString().split('T')[0],
          accountId: docRef.id,
          accountName: accountData.accountName,
          description: 'Opening Balance',
          referenceType: 'opening_balance',
          debitAmount: accountData.openingBalance > 0 ? accountData.openingBalance : 0,
          creditAmount: accountData.openingBalance < 0 ? Math.abs(accountData.openingBalance) : 0,
          runningBalance: accountData.openingBalance,
          isReconciled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating ledger account:', error);
      throw error;
    }
  }

  async updateAccount(accountId: string, updates: Partial<LedgerAccount>): Promise<void> {
    try {
      const accountRef = doc(this.accountsCollection, accountId);
      await updateDoc(accountRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating ledger account:', error);
      throw error;
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    try {
      // Check if account has transactions
      const transactionsQuery = query(
        this.transactionsCollection,
        where('accountId', '==', accountId),
        limit(1)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);

      if (!transactionsSnapshot.empty) {
        throw new Error('Cannot delete account with existing transactions');
      }

      await deleteDoc(doc(this.accountsCollection, accountId));
    } catch (error) {
      console.error('Error deleting ledger account:', error);
      throw error;
    }
  }

  async getAccounts(filters?: {
    accountType?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<LedgerAccount[]> {
    try {
      let q = query(this.accountsCollection, orderBy('accountName'));

      if (filters?.accountType) {
        q = query(this.accountsCollection, where('accountType', '==', filters.accountType), orderBy('accountName'));
      }

      if (filters?.isActive !== undefined) {
        q = query(this.accountsCollection, where('isActive', '==', filters.isActive), orderBy('accountName'));
      }

      const querySnapshot = await getDocs(q);
      let accounts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LedgerAccount));

      // Client-side search if provided
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        accounts = accounts.filter(account =>
          account.accountName.toLowerCase().includes(searchTerm) ||
          account.accountCode.toLowerCase().includes(searchTerm) ||
          account.gstNumber?.toLowerCase().includes(searchTerm)
        );
      }

      return accounts;
    } catch (error) {
      console.error('Error fetching ledger accounts:', error);
      throw error;
    }
  }

  async getAccountById(accountId: string): Promise<LedgerAccount | null> {
    try {
      const docRef = doc(this.accountsCollection, accountId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as LedgerAccount;
      }
      return null;
    } catch (error) {
      console.error('Error fetching ledger account:', error);
      throw error;
    }
  }

  // Transaction Management
  async createTransaction(transactionData: Omit<LedgerTransaction, 'id'>): Promise<string> {
    try {
      const batch = writeBatch(db);

      // Create transaction
      const transactionRef = doc(this.transactionsCollection);
      batch.set(transactionRef, transactionData);

      // Update account balance
      const accountRef = doc(this.accountsCollection, transactionData.accountId);
      const accountSnap = await getDoc(accountRef);
      
      if (accountSnap.exists()) {
        const account = accountSnap.data() as LedgerAccount;
        const balanceChange = transactionData.debitAmount - transactionData.creditAmount;
        const newBalance = account.currentBalance + balanceChange;

        batch.update(accountRef, {
          currentBalance: newBalance,
          debitBalance: account.debitBalance + transactionData.debitAmount,
          creditBalance: account.creditBalance + transactionData.creditAmount,
          lastTransactionDate: transactionData.transactionDate,
          updatedAt: new Date().toISOString()
        });

        // Create GST ledger entries if GST details provided
        if (transactionData.gstDetails && transactionData.gstDetails.gstAmount > 0) {
          await this.createGSTLedgerEntries(transactionRef.id, transactionData);
        }
      }

      await batch.commit();
      return transactionRef.id;
    } catch (error) {
      console.error('Error creating ledger transaction:', error);
      throw error;
    }
  }

  async getTransactions(
    accountId?: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      referenceType?: string;
      isReconciled?: boolean;
      limit?: number;
    }
  ): Promise<LedgerTransaction[]> {
    try {
      let q = query(this.transactionsCollection, orderBy('transactionDate', 'desc'));

      if (accountId) {
        q = query(
          this.transactionsCollection,
          where('accountId', '==', accountId),
          orderBy('transactionDate', 'desc')
        );
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      let transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LedgerTransaction));

      // Apply client-side filters
      if (filters?.startDate) {
        transactions = transactions.filter(t => t.transactionDate >= filters.startDate!);
      }

      if (filters?.endDate) {
        transactions = transactions.filter(t => t.transactionDate <= filters.endDate!);
      }

      if (filters?.referenceType) {
        transactions = transactions.filter(t => t.referenceType === filters.referenceType);
      }

      if (filters?.isReconciled !== undefined) {
        transactions = transactions.filter(t => t.isReconciled === filters.isReconciled);
      }

      return transactions;
    } catch (error) {
      console.error('Error fetching ledger transactions:', error);
      throw error;
    }
  }

  async getAccountStatement(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<AccountStatement> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      const transactions = await this.getTransactions(accountId, {
        startDate,
        endDate
      });

      // Calculate running balances
      let runningBalance = account.openingBalance;
      const transactionsWithBalance = transactions.reverse().map(transaction => {
        const balanceChange = transaction.debitAmount - transaction.creditAmount;
        runningBalance += balanceChange;
        return {
          ...transaction,
          runningBalance
        };
      });

      const summary = {
        openingBalance: account.openingBalance,
        totalDebits: transactions.reduce((sum, t) => sum + t.debitAmount, 0),
        totalCredits: transactions.reduce((sum, t) => sum + t.creditAmount, 0),
        closingBalance: runningBalance,
        transactionCount: transactions.length
      };

      return {
        account,
        transactions: transactionsWithBalance.reverse(),
        summary
      };
    } catch (error) {
      console.error('Error generating account statement:', error);
      throw error;
    }
  }

  // GST Ledger Management
  private async createGSTLedgerEntries(
    transactionId: string,
    transaction: LedgerTransaction
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const gstDetails = transaction.gstDetails!;
      const date = new Date(transaction.transactionDate);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const returnPeriod = `${year}-${month.toString().padStart(2, '0')}`;

      // Determine GST type based on account type
      const account = await this.getAccountById(transaction.accountId);
      const gstType = account?.accountType === 'supplier' ? 'input' : 'output';

      // Create entries for each GST component
      if (gstDetails.cgstAmount > 0) {
        const cgstRef = doc(this.gstLedgerCollection);
        batch.set(cgstRef, {
          transactionId,
          accountId: transaction.accountId,
          gstType,
          gstComponent: 'cgst',
          gstRate: gstDetails.gstRate / 2,
          taxableAmount: gstDetails.gstAmount > 0 ? (gstDetails.cgstAmount * 2) / (gstDetails.gstRate / 100) : 0,
          gstAmount: gstDetails.cgstAmount,
          month,
          year,
          returnPeriod,
          isReconciled: false,
          isReversed: false,
          createdAt: new Date().toISOString()
        });
      }

      if (gstDetails.sgstAmount > 0) {
        const sgstRef = doc(this.gstLedgerCollection);
        batch.set(sgstRef, {
          transactionId,
          accountId: transaction.accountId,
          gstType,
          gstComponent: 'sgst',
          gstRate: gstDetails.gstRate / 2,
          taxableAmount: gstDetails.gstAmount > 0 ? (gstDetails.sgstAmount * 2) / (gstDetails.gstRate / 100) : 0,
          gstAmount: gstDetails.sgstAmount,
          month,
          year,
          returnPeriod,
          isReconciled: false,
          isReversed: false,
          createdAt: new Date().toISOString()
        });
      }

      if (gstDetails.igstAmount > 0) {
        const igstRef = doc(this.gstLedgerCollection);
        batch.set(igstRef, {
          transactionId,
          accountId: transaction.accountId,
          gstType,
          gstComponent: 'igst',
          gstRate: gstDetails.gstRate,
          taxableAmount: gstDetails.gstAmount > 0 ? gstDetails.igstAmount / (gstDetails.gstRate / 100) : 0,
          gstAmount: gstDetails.igstAmount,
          month,
          year,
          returnPeriod,
          isReconciled: false,
          isReversed: false,
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error creating GST ledger entries:', error);
      throw error;
    }
  }

  async getGSTLedger(filters?: {
    gstType?: 'input' | 'output';
    returnPeriod?: string;
    accountId?: string;
    isReconciled?: boolean;
  }): Promise<GSTLedgerEntry[]> {
    try {
      let q = query(this.gstLedgerCollection, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      let entries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GSTLedgerEntry));

      // Apply filters
      if (filters?.gstType) {
        entries = entries.filter(e => e.gstType === filters.gstType);
      }

      if (filters?.returnPeriod) {
        entries = entries.filter(e => e.returnPeriod === filters.returnPeriod);
      }

      if (filters?.accountId) {
        entries = entries.filter(e => e.accountId === filters.accountId);
      }

      if (filters?.isReconciled !== undefined) {
        entries = entries.filter(e => e.isReconciled === filters.isReconciled);
      }

      return entries;
    } catch (error) {
      console.error('Error fetching GST ledger:', error);
      throw error;
    }
  }

  // Utility functions
  private async generateAccountCode(accountType: string): Promise<string> {
    try {
      const prefix = this.getAccountCodePrefix(accountType);
      const accountsQuery = query(
        this.accountsCollection,
        where('accountCode', '>=', prefix),
        where('accountCode', '<', prefix + '\uf8ff'),
        orderBy('accountCode', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(accountsQuery);
      let nextNumber = 1;

      if (!snapshot.empty) {
        const lastCode = snapshot.docs[0].data().accountCode;
        const lastNumber = parseInt(lastCode.replace(prefix, ''));
        nextNumber = lastNumber + 1;
      }

      return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating account code:', error);
      return `${this.getAccountCodePrefix(accountType)}0001`;
    }
  }

  private getAccountCodePrefix(accountType: string): string {
    const prefixes = {
      'supplier': 'SUP',
      'customer': 'CUS',
      'bank': 'BNK',
      'cash': 'CSH',
      'expense': 'EXP',
      'income': 'INC',
      'asset': 'AST',
      'liability': 'LIB'
    };
    return prefixes[accountType as keyof typeof prefixes] || 'GEN';
  }

  private async generateTransactionNumber(): Promise<string> {
    try {
      const today = new Date();
      const datePrefix = `TXN${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const transactionsQuery = query(
        this.transactionsCollection,
        where('transactionNumber', '>=', datePrefix),
        where('transactionNumber', '<', datePrefix + '\uf8ff'),
        orderBy('transactionNumber', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(transactionsQuery);
      let nextNumber = 1;

      if (!snapshot.empty) {
        const lastNumber = snapshot.docs[0].data().transactionNumber;
        const lastSeq = parseInt(lastNumber.replace(datePrefix, ''));
        nextNumber = lastSeq + 1;
      }

      return `${datePrefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating transaction number:', error);
      return `TXN${Date.now()}`;
    }
  }

  async getLedgerSummary(): Promise<LedgerSummary> {
    try {
      const [accountsSnapshot, transactionsSnapshot] = await Promise.all([
        getDocs(this.accountsCollection),
        getDocs(this.transactionsCollection)
      ]);

      const accounts = accountsSnapshot.docs.map(doc => doc.data() as LedgerAccount);
      const transactions = transactionsSnapshot.docs.map(doc => doc.data() as LedgerTransaction);

      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = transactions.filter(t => t.transactionDate === today);
      const pendingReconciliation = transactions.filter(t => !t.isReconciled);

      return {
        totalAccounts: accounts.length,
        totalSuppliers: accounts.filter(a => a.accountType === 'supplier' && a.isActive).length,
        totalCustomers: accounts.filter(a => a.accountType === 'customer' && a.isActive).length,
        totalDebitBalance: accounts.reduce((sum, a) => sum + a.debitBalance, 0),
        totalCreditBalance: accounts.reduce((sum, a) => sum + a.creditBalance, 0),
        totalTransactions: transactions.length,
        todayTransactions: todayTransactions.length,
        pendingReconciliation: pendingReconciliation.length
      };
    } catch (error) {
      console.error('Error fetching ledger summary:', error);
      throw error;
    }
  }

  // Reconciliation functions
  async reconcileTransaction(transactionId: string, reconciledBy?: string): Promise<void> {
    try {
      const transactionRef = doc(this.transactionsCollection, transactionId);
      await updateDoc(transactionRef, {
        isReconciled: true,
        reconciledDate: new Date().toISOString(),
        reconciledBy: reconciledBy || 'system',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error reconciling transaction:', error);
      throw error;
    }
  }

  async bulkReconcileTransactions(transactionIds: string[], reconciledBy?: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      transactionIds.forEach(id => {
        const transactionRef = doc(this.transactionsCollection, id);
        batch.update(transactionRef, {
          isReconciled: true,
          reconciledDate: new Date().toISOString(),
          reconciledBy: reconciledBy || 'system',
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk reconciling transactions:', error);
      throw error;
    }
  }
}

export const ledgerService = new LedgerService();
export default ledgerService;