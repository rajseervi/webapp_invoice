import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { transactionService } from './transactionService';

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  saleDate: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: number | string;
    quantity: number;
    price: number;
    discount: number;
    subtotal?: number;
    finalPrice?: number;
    name?: string;
    category?: string;
    discountType?: string;
  }>;
  totalAmount?: number;
  notes?: string;
  createdAt: string;
  partyId?: string;
  partyName?: string;
  total?: number;
  date?: string;
  transactionId?: string;
  subtotal?: number;
  discount?: number;
  categoryDiscounts?: Record<string, number>;
  userId?: string; // Add userId to track which user created the invoice
}

export const invoiceService = {
  async createInvoice(invoiceData: Omit<Invoice, 'createdAt'>) {
    try {
      // Add creation timestamp
      const timestamp = new Date().toISOString();
      
      // Create the invoice document
      const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        createdAt: timestamp
      });
      
      // Create a corresponding transaction in the accounting system
      if (invoiceData.partyId && (invoiceData.total || invoiceData.totalAmount)) {
        try {
          // Determine the amount to use (support both total and totalAmount fields)
          const amount = invoiceData.total || invoiceData.totalAmount || 0;
          
          // Create the transaction
          const transactionId = await transactionService.createTransaction({
            partyId: invoiceData.partyId,
            userId: invoiceData.userId || 'system', // Use the userId from the invoice or default to 'system'
            amount: amount,
            type: 'debit', // Invoice creates a receivable (party owes us)
            description: `Invoice ${invoiceData.invoiceNumber}`,
            reference: invoiceData.invoiceNumber,
            date: invoiceData.date || invoiceData.saleDate || timestamp.split('T')[0]
          });
          
          console.log(`Created transaction ${transactionId} for invoice ${invoiceData.invoiceNumber}`);
          
          // Update the invoice with the transaction ID for reference
          await updateDoc(doc(db, 'invoices', docRef.id), {
            transactionId: transactionId
          });
          
          console.log(`Updated invoice ${docRef.id} with transaction ID ${transactionId}`);
        } catch (transactionError) {
          console.error('Error creating transaction for invoice:', transactionError);
          // Don't fail the invoice creation if transaction creation fails
        }
      } else {
        console.warn(`Cannot create transaction for invoice ${invoiceData.invoiceNumber}: Missing partyId or amount`);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  async getInvoices(userId?: string) {
    try {
      let querySnapshot;
      
      if (userId) {
        // If userId is provided, filter by userId
        const q = query(
          collection(db, 'invoices'),
          where('userId', '==', userId)
        );
        querySnapshot = await getDocs(q);
      } else {
        // Otherwise, get all invoices
        querySnapshot = await getDocs(collection(db, 'invoices'));
      }
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },
  
  async getUserInvoices(userId: string) {
    try {
      if (!userId) {
        console.error('Invalid userId provided');
        return [];
      }
      
      console.log(`Fetching invoices for user ID: ${userId}`);
      
      // Get invoices for this user
      const q = query(
        collection(db, 'invoices'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const invoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Found ${invoices.length} invoices for user ID: ${userId}`);
      
      return invoices;
    } catch (error) {
      console.error('Error fetching user invoices:', error);
      return [];
    }
  },
  
  async getPartyInvoices(partyId: string, userId?: string) {
    try {
      if (!partyId) {
        console.error('Invalid partyId provided:', partyId);
        return [];
      }
      
      console.log(`Fetching invoices for party ID: ${partyId}${userId ? ` and user ID: ${userId}` : ''}`);
      
      let querySnapshot;
      
      if (userId) {
        // If userId is provided, filter by both partyId and userId
        const q = query(
          collection(db, 'invoices'),
          where('partyId', '==', partyId),
          where('userId', '==', userId)
        );
        querySnapshot = await getDocs(q);
      } else {
        // Otherwise, just filter by partyId
        const q = query(
          collection(db, 'invoices'),
          where('partyId', '==', partyId)
        );
        querySnapshot = await getDocs(q);
      }
      
      // Convert documents to invoice objects
      const invoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Found ${invoices.length} invoices for party ID: ${partyId}${userId ? ` and user ID: ${userId}` : ''}`);
      
      return invoices;
    } catch (error) {
      console.error('Error fetching party invoices:', error);
      return [];
    }
  },

  async updateInvoice(id: string, data: Partial<Invoice>) {
    try {
      const docRef = doc(db, 'invoices', id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },

  async deleteInvoice(id: string) {
    try {
      const docRef = doc(db, 'invoices', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }
};