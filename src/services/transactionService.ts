import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { Transaction, TransactionFormData, PartyBalance } from '@/types/transaction';
import { Party } from '@/types/party';

export const transactionService = {
  async createTransaction(transactionData: TransactionFormData) {
    try {
      const now = new Date().toISOString();
      
      // Create the transaction
      const docRef = await addDoc(collection(db, 'transactions'), {
        ...transactionData,
        createdAt: now,
        updatedAt: now
      });
      
      // Update party's outstanding balance
      await this.updatePartyBalance(transactionData.partyId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  async getTransactions() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'transactions'), orderBy('date', 'desc'))
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  async getPartyTransactions(partyId: string) {
    try {
      if (!partyId) {
        console.error('Invalid partyId provided:', partyId);
        return [];
      }
      
      console.log(`Fetching transactions for party ID: ${partyId}`);
      
      const querySnapshot = await getDocs(
        query(
          collection(db, 'transactions'), 
          where('partyId', '==', partyId),
          orderBy('date', 'desc')
        )
      );
      
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      
      console.log(`Found ${transactions.length} transactions for party ID: ${partyId}`);
      
      return transactions;
    } catch (error) {
      console.error('Error fetching party transactions:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  async getTransaction(id: string) {
    try {
      const docRef = doc(db, 'transactions', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Transaction;
      }
      
      throw new Error('Transaction not found');
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  },

  async updateTransaction(id: string, data: Partial<TransactionFormData>) {
    try {
      const docRef = doc(db, 'transactions', id);
      const transaction = await this.getTransaction(id);
      
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      // If party ID changed, update both old and new party balances
      if (data.partyId && data.partyId !== transaction.partyId) {
        await this.updatePartyBalance(transaction.partyId);
        await this.updatePartyBalance(data.partyId);
      } else {
        // Otherwise just update the current party's balance
        await this.updatePartyBalance(transaction.partyId);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  async deleteTransaction(id: string) {
    try {
      const transaction = await this.getTransaction(id);
      const docRef = doc(db, 'transactions', id);
      
      await deleteDoc(docRef);
      
      // Update party balance after deletion
      await this.updatePartyBalance(transaction.partyId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  async updatePartyBalance(partyId: string) {
    try {
      // Get all transactions for this party
      const transactions = await this.getPartyTransactions(partyId);
      
      // Calculate total credit and debit
      let totalCredit = 0;
      let totalDebit = 0;
      
      transactions.forEach(transaction => {
        if (transaction.type === 'credit') {
          totalCredit += transaction.amount;
        } else {
          totalDebit += transaction.amount;
        }
      });
      
      // Calculate outstanding balance (positive means party owes money)
      const outstandingBalance = totalDebit - totalCredit;
      
      // Update party document
      const partyRef = doc(db, 'parties', partyId);
      await updateDoc(partyRef, {
        outstandingBalance,
        updatedAt: new Date().toISOString()
      });
      
      return outstandingBalance;
    } catch (error) {
      console.error('Error updating party balance:', error);
      throw error;
    }
  },

  async getPartyBalances(): Promise<PartyBalance[]> {
    try {
      // Get all parties
      const partiesSnapshot = await getDocs(collection(db, 'parties'));
      const parties = partiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Party[];
      
      if (parties.length === 0) {
        console.log('No parties found in the database');
        return [];
      }
      
      // Get all transactions
      const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      
      console.log(`Found ${parties.length} parties and ${transactions.length} transactions`);
      
      // Calculate balances for each party
      const balances: PartyBalance[] = parties.map(party => {
        const partyTransactions = transactions.filter(t => t.partyId === party.id);
        
        let totalCredit = 0;
        let totalDebit = 0;
        let lastTransactionDate: string | undefined;
        
        partyTransactions.forEach(transaction => {
          // Ensure amount is a number
          const amount = typeof transaction.amount === 'number' 
            ? transaction.amount 
            : parseFloat(transaction.amount as any) || 0;
            
          if (transaction.type === 'credit') {
            totalCredit += amount;
          } else {
            totalDebit += amount;
          }
          
          // Track the most recent transaction date
          if (!lastTransactionDate || new Date(transaction.date) > new Date(lastTransactionDate)) {
            lastTransactionDate = transaction.date;
          }
        });
        
        // Calculate balance (positive means party owes money)
        const balance = totalDebit - totalCredit;
        
        return {
          partyId: party.id || '',
          partyName: party.name || 'Unknown Party',
          totalCredit,
          totalDebit,
          balance,
          lastTransactionDate
        };
      });
      
      return balances;
    } catch (error) {
      console.error('Error calculating party balances:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }
};