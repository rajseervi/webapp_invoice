import { EnhancedProduct } from '@/app/products/components/EnhancedProductList';

// This is a mock service. In a real application, you would replace these with actual API calls.
// For example, using fetch, axios, or a Firebase SDK.

const MOCK_ENHANCED_PRODUCTS: EnhancedProduct[] = [
  {
    id: '1',
    name: 'Enhanced Product A',
    category: 'Electronics',
    price: 1200,
    stock: 50,
    status: 'Active',
    description: 'A high-performance enhanced product.',
    sku: 'EPA001',
    unit: 'Pcs',
    manufacturer: 'TechCorp',
    tags: ['new', 'featured'],
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2023-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Enhanced Product B',
    category: 'Books',
    price: 25,
    stock: 200,
    status: 'Inactive',
    description: 'An informative enhanced book.',
    sku: 'EPB002',
    unit: 'Pcs',
    manufacturer: 'PublishCo',
    tags: ['bestseller'],
    createdAt: '2023-02-01T11:00:00Z',
    updatedAt: '2023-02-01T11:00:00Z',
  },
];

export const enhancedProductService = {
  getEnhancedProduct: async (id: string): Promise<EnhancedProduct | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const product = MOCK_ENHANCED_PRODUCTS.find(p => p.id === id);
        resolve(product || null);
      }, 500);
    });
  },

  updateEnhancedProduct: async (id: string, data: Partial<EnhancedProduct>): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = MOCK_ENHANCED_PRODUCTS.findIndex(p => p.id === id);
        if (index !== -1) {
          MOCK_ENHANCED_PRODUCTS[index] = { ...MOCK_ENHANCED_PRODUCTS[index], ...data, updatedAt: new Date().toISOString() };
          console.log('Updated Product:', MOCK_ENHANCED_PRODUCTS[index]);
          resolve();
        } else {
          reject(new Error('Product not found'));
        }
      }, 500);
    });
  },

  getEnhancedProducts: async (): Promise<EnhancedProduct[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_ENHANCED_PRODUCTS);
      }, 500);
    });
  },
};