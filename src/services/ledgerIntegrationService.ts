import { db } from '@/firebase/config';
import { 
  collection, 
  getDocs, 
  doc, 
  writeBatch,
  query,
  where,
  orderBy,
  deleteDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { ledgerService, LedgerAccount, LedgerTransaction } from './ledgerService';
import { SimplePartyService } from './simplePartyService';
import { Party } from '@/types/party_no_gst';

export interface LedgerIntegrationResult {
  success: boolean;
  accountsCreated: number;
  transactionsCreated: number;
  errors: string[];
  warnings: string[];
}

export interface RealTimeSync {
  unsubscribe: () => void;
}

export class LedgerIntegrationService {
  private static instance: LedgerIntegrationService;
  private realTimeSyncs: RealTimeSync[] = [];

  static getInstance(): LedgerIntegrationService {
    if (!this.instance) {
      this.instance = new LedgerIntegrationService();
    }
    return this.instance;
  }

  /**
   * Complete integration of existing business data with ledger system
   */
  async integrateAllBusinessData(): Promise<LedgerIntegrationResult> {
    const result: LedgerIntegrationResult = {
      success: false,
      accountsCreated: 0,
      transactionsCreated: 0,
      errors: [],
      warnings: []
    };

    try {
      console.log('🚀 Starting complete ledger integration...');

      // Step 1: Clear existing dummy data
      await this.clearDummyData();
      console.log('✅ Cleared existing dummy data');

      // Step 2: Sync parties as ledger accounts
      const partySync = await this.syncPartiesAsLedgerAccounts();
      result.accountsCreated += partySync.accountsCreated;
      result.errors.push(...partySync.errors);
      result.warnings.push(...partySync.warnings);

      // Step 3: Create essential system accounts
      const systemAccounts = await this.createSystemAccounts();
      result.accountsCreated += systemAccounts.accountsCreated;
      result.errors.push(...systemAccounts.errors);

      // Step 4: Import existing transactions
      const transactionSync = await this.importExistingTransactions();
      result.transactionsCreated += transactionSync.transactionsCreated;
      result.errors.push(...transactionSync.errors);
      result.warnings.push(...transactionSync.warnings);

      // Step 5: Import invoice data as ledger transactions
      const invoiceSync = await this.importInvoiceTransactions();
      result.transactionsCreated += invoiceSync.transactionsCreated;
      result.errors.push(...invoiceSync.errors);
      result.warnings.push(...invoiceSync.warnings);

      // Step 6: Setup real-time synchronization
      await this.setupRealTimeSync();
      console.log('✅ Real-time synchronization enabled');

      result.success = result.errors.length === 0;
      
      console.log(`🎉 Integration complete! Created ${result.accountsCreated} accounts and ${result.transactionsCreated} transactions`);
      
      return result;
    } catch (error) {
      console.error('❌ Error during ledger integration:', error);
      result.errors.push(`Integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Clear existing dummy/sample data from ledger
   */
  private async clearDummyData(): Promise<void> {
    try {
      const batch = writeBatch(db);
      let batchCount = 0;

      // Clear ledger accounts
      const accountsSnapshot = await getDocs(collection(db, 'ledger_accounts'));
      for (const docSnapshot of accountsSnapshot.docs) {
        batch.delete(docSnapshot.ref);
        batchCount++;
        
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      }

      // Clear ledger transactions
      const transactionsSnapshot = await getDocs(collection(db, 'ledger_transactions'));
      for (const docSnapshot of transactionsSnapshot.docs) {
        batch.delete(docSnapshot.ref);
        batchCount++;
        
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      }

      // Clear GST ledger
      const gstSnapshot = await getDocs(collection(db, 'gst_ledger'));
      for (const docSnapshot of gstSnapshot.docs) {
        batch.delete(docSnapshot.ref);
        batchCount++;
        
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error clearing dummy data:', error);
      throw error;
    }
  }

  /**
   * Sync existing parties as ledger accounts
   */
  private async syncPartiesAsLedgerAccounts(): Promise<{
    accountsCreated: number;
    errors: string[];
    warnings: string[];
  }> {
    const result = { accountsCreated: 0, errors: [], warnings: [] };

    try {
      // Get all parties
      const parties = await SimplePartyService.getParties();
      console.log(`Found ${parties.length} parties to sync`);

      for (const party of parties) {
        try {
          const accountType = this.mapPartyTypeToAccountType(party.businessType);
          
          const accountData: Omit<LedgerAccount, 'id' | 'createdAt' | 'updatedAt'> = {
            accountCode: '', // Will be auto-generated
            accountName: party.name,
            accountType,
            partyId: party.id,
            isGstApplicable: false, // Parties don't have GST in this system
            gstNumber: '',
            address: party.address || '',
            phone: party.phone || '',
            email: party.email || '',
            contactPerson: party.contactPerson || '',
            creditLimit: party.creditLimit || 0,
            creditDays: 30,
            openingBalance: party.outstandingBalance || 0,
            currentBalance: party.outstandingBalance || 0,
            debitBalance: (party.outstandingBalance || 0) > 0 ? party.outstandingBalance : 0,
            creditBalance: (party.outstandingBalance || 0) < 0 ? Math.abs(party.outstandingBalance) : 0,
            isActive: party.isActive ?? true
          };

          await ledgerService.createAccount(accountData);
          result.accountsCreated++;
          
        } catch (error) {
          const errorMsg = `Failed to create account for party ${party.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`Failed to sync parties: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Create essential system accounts
   */
  private async createSystemAccounts(): Promise<{
    accountsCreated: number;
    errors: string[];
  }> {
    const result = { accountsCreated: 0, errors: [] };

    const systemAccounts = [
      {
        accountName: 'Cash Account',
        accountType: 'cash' as const,
        openingBalance: 50000,
        isGstApplicable: false
      },
      {
        accountName: 'Bank Account - Current',
        accountType: 'bank' as const,
        openingBalance: 200000,
        isGstApplicable: false
      },
      {
        accountName: 'Sales Revenue',
        accountType: 'income' as const,
        openingBalance: 0,
        isGstApplicable: true
      },
      {
        accountName: 'Purchase Expense',
        accountType: 'expense' as const,
        openingBalance: 0,
        isGstApplicable: true
      },
      {
        accountName: 'Office Expenses',
        accountType: 'expense' as const,
        openingBalance: 0,
        isGstApplicable: true
      },
      {
        accountName: 'GST Input Tax Credit',
        accountType: 'asset' as const,
        openingBalance: 0,
        isGstApplicable: false
      },
      {
        accountName: 'GST Output Tax Liability',
        accountType: 'liability' as const,
        openingBalance: 0,
        isGstApplicable: false
      }
    ];

    for (const accountData of systemAccounts) {
      try {
        const fullAccountData: Omit<LedgerAccount, 'id' | 'createdAt' | 'updatedAt'> = {
          accountCode: '',
          accountName: accountData.accountName,
          accountType: accountData.accountType,
          isGstApplicable: accountData.isGstApplicable,
          gstNumber: '',
          address: '',
          phone: '',
          email: '',
          contactPerson: '',
          creditLimit: 0,
          creditDays: 0,
          openingBalance: accountData.openingBalance,
          currentBalance: accountData.openingBalance,
          debitBalance: accountData.openingBalance > 0 ? accountData.openingBalance : 0,
          creditBalance: accountData.openingBalance < 0 ? Math.abs(accountData.openingBalance) : 0,
          isActive: true
        };

        await ledgerService.createAccount(fullAccountData);
        result.accountsCreated++;
      } catch (error) {
        const errorMsg = `Failed to create system account ${accountData.accountName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return result;
  }

  /**
   * Import existing transactions from transactions collection
   */
  private async importExistingTransactions(): Promise<{
    transactionsCreated: number;
    errors: string[];
    warnings: string[];
  }> {
    const result = { transactionsCreated: 0, errors: [], warnings: [] };

    try {
      // Get all existing transactions
      const transactionsSnapshot = await getDocs(
        query(collection(db, 'transactions'), orderBy('date', 'desc'))
      );

      console.log(`Found ${transactionsSnapshot.docs.length} existing transactions to import`);

      // Get all ledger accounts for mapping
      const ledgerAccounts = await ledgerService.getAccounts();
      const partyAccountMap = new Map<string, LedgerAccount>();
      
      ledgerAccounts.forEach(account => {
        if (account.partyId) {
          partyAccountMap.set(account.partyId, account);
        }
      });

      for (const transactionDoc of transactionsSnapshot.docs) {
        try {
          const transaction = { id: transactionDoc.id, ...transactionDoc.data() };
          
          // Find corresponding ledger account
          const ledgerAccount = partyAccountMap.get(transaction.partyId);
          if (!ledgerAccount) {
            result.warnings.push(`No ledger account found for party ${transaction.partyId} in transaction ${transaction.id}`);
            continue;
          }

          // Create ledger transaction
          const ledgerTransactionData: Omit<LedgerTransaction, 'id'> = {
            transactionNumber: this.generateTransactionNumber(),
            transactionDate: transaction.date || new Date().toISOString().split('T')[0],
            accountId: ledgerAccount.id!,
            accountName: ledgerAccount.accountName,
            description: transaction.description || `${transaction.type} - ${transaction.category}`,
            referenceNumber: transaction.id,
            referenceType: 'journal',
            referenceId: transaction.id,
            debitAmount: transaction.type === 'debit' ? transaction.amount : 0,
            creditAmount: transaction.type === 'credit' ? transaction.amount : 0,
            runningBalance: 0, // Will be calculated by the service
            isReconciled: false,
            createdAt: transaction.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await ledgerService.createTransaction(ledgerTransactionData);
          result.transactionsCreated++;

        } catch (error) {
          const errorMsg = `Failed to import transaction ${transactionDoc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`Failed to import transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Import invoice data as ledger transactions
   */
  private async importInvoiceTransactions(): Promise<{
    transactionsCreated: number;
    errors: string[];
    warnings: string[];
  }> {
    const result = { transactionsCreated: 0, errors: [], warnings: [] };

    try {
      // Get all invoices
      const invoicesSnapshot = await getDocs(
        query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
      );

      console.log(`Found ${invoicesSnapshot.docs.length} invoices to import`);

      // Get all ledger accounts for mapping
      const ledgerAccounts = await ledgerService.getAccounts();
      const partyAccountMap = new Map<string, LedgerAccount>();
      const systemAccountMap = new Map<string, LedgerAccount>();
      
      ledgerAccounts.forEach(account => {
        if (account.partyId) {
          partyAccountMap.set(account.partyId, account);
        } else {
          systemAccountMap.set(account.accountName.toLowerCase(), account);
        }
      });

      for (const invoiceDoc of invoicesSnapshot.docs) {
        try {
          const invoice = { id: invoiceDoc.id, ...invoiceDoc.data() };
          
          // Find party account
          const partyAccount = partyAccountMap.get(invoice.partyId);
          if (!partyAccount) {
            result.warnings.push(`No ledger account found for party ${invoice.partyId} in invoice ${invoice.id}`);
            continue;
          }

          // Get appropriate revenue/expense account
          const revenueExpenseAccount = invoice.type === 'sales' 
            ? systemAccountMap.get('sales revenue')
            : systemAccountMap.get('purchase expense');

          if (!revenueExpenseAccount) {
            result.warnings.push(`No ${invoice.type === 'sales' ? 'revenue' : 'expense'} account found for invoice ${invoice.id}`);
            continue;
          }

          const invoiceAmount = invoice.totalAmount || invoice.total || 0;
          const invoiceDate = invoice.date || invoice.createdAt || new Date().toISOString();

          // Create party ledger transaction
          const partyTransactionData: Omit<LedgerTransaction, 'id'> = {
            transactionNumber: this.generateTransactionNumber(),
            transactionDate: typeof invoiceDate === 'string' ? invoiceDate.split('T')[0] : new Date(invoiceDate).toISOString().split('T')[0],
            accountId: partyAccount.id!,
            accountName: partyAccount.accountName,
            description: `${invoice.type === 'sales' ? 'Sales' : 'Purchase'} Invoice - ${invoice.invoiceNumber || invoice.id}`,
            referenceNumber: invoice.invoiceNumber || invoice.id,
            referenceType: 'invoice',
            referenceId: invoice.id,
            debitAmount: invoice.type === 'sales' ? invoiceAmount : 0,
            creditAmount: invoice.type === 'purchase' ? invoiceAmount : 0,
            runningBalance: 0,
            isReconciled: false,
            createdAt: typeof invoiceDate === 'string' ? invoiceDate : new Date(invoiceDate).toISOString(),
            updatedAt: new Date().toISOString()
          };

          await ledgerService.createTransaction(partyTransactionData);
          result.transactionsCreated++;

          // Create revenue/expense ledger transaction (contra entry)
          const revenueExpenseTransactionData: Omit<LedgerTransaction, 'id'> = {
            transactionNumber: this.generateTransactionNumber(),
            transactionDate: typeof invoiceDate === 'string' ? invoiceDate.split('T')[0] : new Date(invoiceDate).toISOString().split('T')[0],
            accountId: revenueExpenseAccount.id!,
            accountName: revenueExpenseAccount.accountName,
            description: `${invoice.type === 'sales' ? 'Sales' : 'Purchase'} Invoice - ${invoice.invoiceNumber || invoice.id}`,
            referenceNumber: invoice.invoiceNumber || invoice.id,
            referenceType: 'invoice',
            referenceId: invoice.id,
            debitAmount: invoice.type === 'purchase' ? invoiceAmount : 0,
            creditAmount: invoice.type === 'sales' ? invoiceAmount : 0,
            runningBalance: 0,
            isReconciled: false,
            createdAt: typeof invoiceDate === 'string' ? invoiceDate : new Date(invoiceDate).toISOString(),
            updatedAt: new Date().toISOString()
          };

          await ledgerService.createTransaction(revenueExpenseTransactionData);
          result.transactionsCreated++;

        } catch (error) {
          const errorMsg = `Failed to import invoice ${invoiceDoc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`Failed to import invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Setup real-time synchronization
   */
  private async setupRealTimeSync(): Promise<void> {
    // Stop existing syncs
    this.stopRealTimeSync();

    // Sync new parties
    const partiesUnsubscribe = onSnapshot(
      collection(db, 'parties'),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            await this.handleNewParty(change.doc.id, change.doc.data() as Party);
          } else if (change.type === 'modified') {
            await this.handleUpdatedParty(change.doc.id, change.doc.data() as Party);
          }
        });
      }
    );

    // Sync new transactions
    const transactionsUnsubscribe = onSnapshot(
      collection(db, 'transactions'),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            await this.handleNewTransaction(change.doc.id, change.doc.data());
          }
        });
      }
    );

    // Sync new invoices
    const invoicesUnsubscribe = onSnapshot(
      collection(db, 'invoices'),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            await this.handleNewInvoice(change.doc.id, change.doc.data());
          }
        });
      }
    );

    this.realTimeSyncs = [
      { unsubscribe: partiesUnsubscribe },
      { unsubscribe: transactionsUnsubscribe },
      { unsubscribe: invoicesUnsubscribe }
    ];
  }

  /**
   * Stop real-time synchronization
   */
  stopRealTimeSync(): void {
    this.realTimeSyncs.forEach(sync => sync.unsubscribe());
    this.realTimeSyncs = [];
  }

  /**
   * Handle new party creation
   */
  private async handleNewParty(partyId: string, partyData: Party): Promise<void> {
    try {
      const accountType = this.mapPartyTypeToAccountType(partyData.businessType);
      
      const accountData: Omit<LedgerAccount, 'id' | 'createdAt' | 'updatedAt'> = {
        accountCode: '',
        accountName: partyData.name,
        accountType,
        partyId: partyId,
        isGstApplicable: false,
        gstNumber: '',
        address: partyData.address || '',
        phone: partyData.phone || '',
        email: partyData.email || '',
        contactPerson: partyData.contactPerson || '',
        creditLimit: partyData.creditLimit || 0,
        creditDays: 30,
        openingBalance: partyData.outstandingBalance || 0,
        currentBalance: partyData.outstandingBalance || 0,
        debitBalance: (partyData.outstandingBalance || 0) > 0 ? partyData.outstandingBalance : 0,
        creditBalance: (partyData.outstandingBalance || 0) < 0 ? Math.abs(partyData.outstandingBalance) : 0,
        isActive: partyData.isActive ?? true
      };

      await ledgerService.createAccount(accountData);
      console.log(`✅ Created ledger account for new party: ${partyData.name}`);
    } catch (error) {
      console.error(`❌ Failed to create ledger account for party ${partyId}:`, error);
    }
  }

  /**
   * Handle party updates
   */
  private async handleUpdatedParty(partyId: string, partyData: Party): Promise<void> {
    try {
      // Find existing ledger account
      const accounts = await ledgerService.getAccounts({ search: partyId });
      const existingAccount = accounts.find(account => account.partyId === partyId);
      
      if (existingAccount) {
        await ledgerService.updateAccount(existingAccount.id!, {
          accountName: partyData.name,
          address: partyData.address || '',
          phone: partyData.phone || '',
          email: partyData.email || '',
          contactPerson: partyData.contactPerson || '',
          creditLimit: partyData.creditLimit || 0,
          isActive: partyData.isActive ?? true
        });
        console.log(`✅ Updated ledger account for party: ${partyData.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to update ledger account for party ${partyId}:`, error);
    }
  }

  /**
   * Handle new transaction
   */
  private async handleNewTransaction(transactionId: string, transactionData: any): Promise<void> {
    try {
      // Find corresponding ledger account
      const accounts = await ledgerService.getAccounts();
      const ledgerAccount = accounts.find(account => account.partyId === transactionData.partyId);
      
      if (!ledgerAccount) {
        console.warn(`No ledger account found for party ${transactionData.partyId} in transaction ${transactionId}`);
        return;
      }

      const ledgerTransactionData: Omit<LedgerTransaction, 'id'> = {
        transactionNumber: this.generateTransactionNumber(),
        transactionDate: transactionData.date || new Date().toISOString().split('T')[0],
        accountId: ledgerAccount.id!,
        accountName: ledgerAccount.accountName,
        description: transactionData.description || `${transactionData.type} - ${transactionData.category}`,
        referenceNumber: transactionId,
        referenceType: 'journal',
        referenceId: transactionId,
        debitAmount: transactionData.type === 'debit' ? transactionData.amount : 0,
        creditAmount: transactionData.type === 'credit' ? transactionData.amount : 0,
        runningBalance: 0,
        isReconciled: false,
        createdAt: transactionData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await ledgerService.createTransaction(ledgerTransactionData);
      console.log(`✅ Created ledger transaction for transaction: ${transactionId}`);
    } catch (error) {
      console.error(`❌ Failed to create ledger transaction for ${transactionId}:`, error);
    }
  }

  /**
   * Handle new invoice
   */
  private async handleNewInvoice(invoiceId: string, invoiceData: any): Promise<void> {
    try {
      const accounts = await ledgerService.getAccounts();
      const partyAccount = accounts.find(account => account.partyId === invoiceData.partyId);
      
      if (!partyAccount) {
        console.warn(`No ledger account found for party ${invoiceData.partyId} in invoice ${invoiceId}`);
        return;
      }

      const revenueExpenseAccount = invoiceData.type === 'sales' 
        ? accounts.find(account => account.accountName.toLowerCase().includes('sales revenue'))
        : accounts.find(account => account.accountName.toLowerCase().includes('purchase expense'));

      if (!revenueExpenseAccount) {
        console.warn(`No ${invoiceData.type === 'sales' ? 'revenue' : 'expense'} account found for invoice ${invoiceId}`);
        return;
      }

      const invoiceAmount = invoiceData.totalAmount || invoiceData.total || 0;
      const invoiceDate = invoiceData.date || invoiceData.createdAt || new Date().toISOString();

      // Create party transaction
      const partyTransactionData: Omit<LedgerTransaction, 'id'> = {
        transactionNumber: this.generateTransactionNumber(),
        transactionDate: typeof invoiceDate === 'string' ? invoiceDate.split('T')[0] : new Date(invoiceDate).toISOString().split('T')[0],
        accountId: partyAccount.id!,
        accountName: partyAccount.accountName,
        description: `${invoiceData.type === 'sales' ? 'Sales' : 'Purchase'} Invoice - ${invoiceData.invoiceNumber || invoiceId}`,
        referenceNumber: invoiceData.invoiceNumber || invoiceId,
        referenceType: 'invoice',
        referenceId: invoiceId,
        debitAmount: invoiceData.type === 'sales' ? invoiceAmount : 0,
        creditAmount: invoiceData.type === 'purchase' ? invoiceAmount : 0,
        runningBalance: 0,
        isReconciled: false,
        createdAt: typeof invoiceDate === 'string' ? invoiceDate : new Date(invoiceDate).toISOString(),
        updatedAt: new Date().toISOString()
      };

      await ledgerService.createTransaction(partyTransactionData);

      // Create revenue/expense transaction
      const revenueExpenseTransactionData: Omit<LedgerTransaction, 'id'> = {
        transactionNumber: this.generateTransactionNumber(),
        transactionDate: typeof invoiceDate === 'string' ? invoiceDate.split('T')[0] : new Date(invoiceDate).toISOString().split('T')[0],
        accountId: revenueExpenseAccount.id!,
        accountName: revenueExpenseAccount.accountName,
        description: `${invoiceData.type === 'sales' ? 'Sales' : 'Purchase'} Invoice - ${invoiceData.invoiceNumber || invoiceId}`,
        referenceNumber: invoiceData.invoiceNumber || invoiceId,
        referenceType: 'invoice',
        referenceId: invoiceId,
        debitAmount: invoiceData.type === 'purchase' ? invoiceAmount : 0,
        creditAmount: invoiceData.type === 'sales' ? invoiceAmount : 0,
        runningBalance: 0,
        isReconciled: false,
        createdAt: typeof invoiceDate === 'string' ? invoiceDate : new Date(invoiceDate).toISOString(),
        updatedAt: new Date().toISOString()
      };

      await ledgerService.createTransaction(revenueExpenseTransactionData);
      console.log(`✅ Created ledger transactions for invoice: ${invoiceId}`);
    } catch (error) {
      console.error(`❌ Failed to create ledger transactions for invoice ${invoiceId}:`, error);
    }
  }

  /**
   * Map party business type to ledger account type
   */
  private mapPartyTypeToAccountType(businessType: string): 'supplier' | 'customer' {
    switch (businessType?.toLowerCase()) {
      case 'supplier':
        return 'supplier';
      case 'customer':
      case 'b2b':
      case 'b2c':
      default:
        return 'customer';
    }
  }

  /**
   * Generate transaction number
   */
  private generateTransactionNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    
    return `TXN${year}${month}${day}${timestamp}`;
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(): Promise<{
    isIntegrated: boolean;
    accountsCount: number;
    transactionsCount: number;
    lastSyncDate?: string;
  }> {
    try {
      const accounts = await ledgerService.getAccounts();
      const transactions = await ledgerService.getTransactions(undefined, { limit: 1 });
      
      return {
        isIntegrated: accounts.length > 0,
        accountsCount: accounts.length,
        transactionsCount: transactions.length,
        lastSyncDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting integration status:', error);
      return {
        isIntegrated: false,
        accountsCount: 0,
        transactionsCount: 0
      };
    }
  }
}

export default LedgerIntegrationService;