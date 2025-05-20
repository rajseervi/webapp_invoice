import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { Category, CategoryDiscount } from '@/types/inventory';

export const categoryService = {
  async createCategory(data: Omit<Category, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...data,
        isActive: true
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  async getCategories() {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  async updateCategory(id: string, data: Partial<Category>) {
    try {
      const docRef = doc(db, 'categories', id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  async setCategoryDiscount(data: CategoryDiscount) {
    try {
      await addDoc(collection(db, 'categoryDiscounts'), {
        ...data,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error setting category discount:', error);
      throw error;
    }
  },

  async getActiveCategoryDiscounts() {
    try {
      const q = query(
        collection(db, 'categoryDiscounts'),
        where('isActive', '==', true),
        where('endDate', '>=', new Date().toISOString())
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CategoryDiscount[];
    } catch (error) {
      console.error('Error fetching category discounts:', error);
      throw error;
    }
  }
};