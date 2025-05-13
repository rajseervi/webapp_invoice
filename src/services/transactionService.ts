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

  async getTransactions(userId?: string) {
    try {
      let queryRef;
      
      if (userId) {
        // If userId is provided, filter by userId
        queryRef = query(
          collection(db, 'transactions'), 
          where('userId', '==', userId),
          orderBy('date', 'desc')
        );
      } else {
        // Otherwise, get all transactions
        queryRef = query(
          collection(db, 'transactions'), 
          orderBy('date', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(queryRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },
  
  async getUserTransactions(userId: string) {
    try {
      if (!userId) {
        console.error('Invalid userId provided');
        return [];
      }
      
      console.log(`Fetching transactions for user ID: ${userId}`);
      
      try {
        // Try with the compound query (requires index)
        const querySnapshot = await getDocs(
          query(
            collection(db, 'transactions'), 
            where('userId', '==', userId),
            orderBy('date', 'desc')
          )
        );
        
        const transactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        
        console.log(`Found ${transactions.length} transactions for user ID: ${userId}`);
        
        return transactions;
      } catch (indexError: any) {
        // Check if this is a missing index error
        if (indexError.message && indexError.message.includes('requires an index')) {
          console.warn('Missing Firestore index. Falling back to basic query without sorting.');
          
          // Fall back to a simpler query without ordering
          const basicQuerySnapshot = await getDocs(
            query(
              collection(db, 'transactions'), 
              where('userId', '==', userId)
            )
          );
          
          // Sort the results in memory instead
          const transactions = basicQuerySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Transaction[];
          
          // Sort by date descending
          transactions.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
          });
          
          console.log(`Found ${transactions.length} transactions for user ID: ${userId} (using fallback query)`);
          
          // Store the index creation URL for display in the UI
          if (indexError.message.includes('https://console.firebase.google.com')) {
            const indexUrl = indexError.message.match(/(https:\/\/console\.firebase\.google\.com\S+)/);
            if (indexUrl && indexUrl[1]) {
              // We'll store this in localStorage so the UI can access it
              if (typeof window !== 'undefined') {
                localStorage.setItem('firestoreIndexUrl', indexUrl[1]);
              }
            }
          }
          
          return transactions;
        } else {
          // If it's not an index error, rethrow
          throw indexError;
        }
      }
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  async getPartyTransactions(partyId: string, userId?: string) {
    try {
      if (!partyId) {
        console.error('Invalid partyId provided:', partyId);
        return [];
      }
      
      console.log(`Fetching transactions for party ID: ${partyId}${userId ? ` and user ID: ${userId}` : ''}`);
      
      try {
        // First try with the compound query (requires index)
        let queryRef;
        
        if (userId) {
          // If userId is provided, filter by both partyId and userId
          queryRef = query(
            collection(db, 'transactions'), 
            where('partyId', '==', partyId),
            where('userId', '==', userId),
            orderBy('date', 'desc')
          );
        } else {
          // Otherwise, just filter by partyId
          queryRef = query(
            collection(db, 'transactions'), 
            where('partyId', '==', partyId),
            orderBy('date', 'desc')
          );
        }
        
        const querySnapshot = await getDocs(queryRef);
        
        const transactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        
        console.log(`Found ${transactions.length} transactions for party ID: ${partyId}${userId ? ` and user ID: ${userId}` : ''}`);
        
        return transactions;
      } catch (indexError: any) {
        // Check if this is a missing index error
        if (indexError.message && indexError.message.includes('requires an index')) {
          console.warn('Missing Firestore index. Falling back to basic query without sorting.');
          
          // Fall back to a simpler query without ordering
          let basicQueryRef;
          
          if (userId) {
            // If userId is provided, filter by both partyId and userId
            basicQueryRef = query(
              collection(db, 'transactions'), 
              where('partyId', '==', partyId),
              where('userId', '==', userId)
            );
          } else {
            // Otherwise, just filter by partyId
            basicQueryRef = query(
              collection(db, 'transactions'), 
              where('partyId', '==', partyId)
            );
          }
          
          const basicQuerySnapshot = await getDocs(basicQueryRef);
          
          // Sort the results in memory instead
          const transactions = basicQuerySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Transaction[];
          
          // Sort by date descending
          transactions.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
          });
          
          console.log(`Found ${transactions.length} transactions for party ID: ${partyId} (using fallback query)`);
          
          // Store the index creation URL for display in the UI
          if (indexError.message.includes('https://console.firebase.google.com')) {
            const indexUrl = indexError.message.match(/(https:\/\/console\.firebase\.google\.com\S+)/);
            if (indexUrl && indexUrl[1]) {
              // We'll store this in localStorage so the UI can access it
              if (typeof window !== 'undefined') {
                localStorage.setItem('firestoreIndexUrl', indexUrl[1]);
              }
            }
          }
          
          return transactions;
        } else {
          // If it's not an index error, rethrow
          throw indexError;
        }
      }
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
      // Don't throw the error, as this would break transaction creation/updates
      // Just return 0 as a fallback
      return 0;
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