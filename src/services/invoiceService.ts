import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface Invoice {
  invoiceNumber: string;
  saleDate: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
  }>;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export const invoiceService = {
  async createInvoice(invoiceData: Omit<Invoice, 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  async getInvoices() {
    try {
      const querySnapshot = await getDocs(collection(db, 'invoices'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
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