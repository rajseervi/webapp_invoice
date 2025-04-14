import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';
import { Product } from '@/types/inventory';
import { categoryService } from './categoryService';

export const productService = {
  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'products'), {
        ...data,
        isActive: true,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  async getProductWithDiscount(productId: string) {
    try {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error('Product not found');

      const product = { id: docSnap.id, ...docSnap.data() } as Product;
      const categoryDiscounts = await categoryService.getActiveCategoryDiscounts();
      const categoryDiscount = categoryDiscounts.find(d => d.categoryId === product.categoryId);

      if (categoryDiscount) {
        return {
          ...product,
          discountedPrice: product.price * (1 - categoryDiscount.discount / 100)
        };
      }

      return product;
    } catch (error) {
      console.error('Error fetching product with discount:', error);
      throw error;
    }
  },

  async getProductsWithDiscounts() {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      const categoryDiscounts = await categoryService.getActiveCategoryDiscounts();

      return products.map(product => {
        const categoryDiscount = categoryDiscounts.find(d => d.categoryId === product.categoryId);
        if (categoryDiscount) {
          return {
            ...product,
            discountedPrice: product.price * (1 - categoryDiscount.discount / 100)
          };
        }
        return product;
      });
    } catch (error) {
      console.error('Error fetching products with discounts:', error);
      throw error;
    }
  }
};