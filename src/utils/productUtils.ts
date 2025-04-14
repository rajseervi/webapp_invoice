import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface Product {
  id: string;
  name: string;
  category?: string;
  price?: number;
  stock?: number;
}

export const removeDuplicateProducts = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Fetch all products
    const productsCollection = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCollection);
    
    // Create a map to store products by name
    const productMap = new Map<string, Product[]>();
    
    // Group products by name
    productsSnapshot.docs.forEach(doc => {
      const data = doc.data() as Product;
      const product = { ...data, id: doc.id };
      const name = product.name.toLowerCase().trim();
      
      if (!productMap.has(name)) {
        productMap.set(name, [product]);
      } else {
        productMap.get(name)?.push(product);
      }
    });
    
    let deletedCount = 0;
    
    // Process each group of products
    for (const [name, products] of productMap.entries()) {
      if (products.length > 1) {
        console.log(`Found ${products.length} duplicates for product: ${name}`);
        
        // Sort products by completeness of information
        const sortedProducts = products.sort((a, b) => {
          const aScore = (a.category ? 1 : 0) + (a.price ? 1 : 0) + (a.stock ? 1 : 0);
          const bScore = (b.category ? 1 : 0) + (b.price ? 1 : 0) + (b.stock ? 1 : 0);
          return bScore - aScore;
        });
        
        // Keep the first product (most complete) and delete the rest
        for (let i = 1; i < sortedProducts.length; i++) {
          console.log(`Deleting duplicate product: ${sortedProducts[i].name} (ID: ${sortedProducts[i].id})`);
          const productRef = doc(db, 'products', sortedProducts[i].id);
          await deleteDoc(productRef);
          deletedCount++;
        }
      }
    }
    
    return {
      success: true,
      message: `Successfully removed ${deletedCount} duplicate products.`
    };
  } catch (error) {
    console.error('Error removing duplicate products:', error);
    // Provide more detailed error message
    const errorMessage = error instanceof Error 
      ? `Error: ${error.message}` 
      : 'Unknown error occurred';
    
    return {
      success: false,
      message: `Failed to remove duplicate products: ${errorMessage}`
    };
  }
};