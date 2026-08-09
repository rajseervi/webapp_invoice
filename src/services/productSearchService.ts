import { Product } from '@/types/inventory';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';

export interface ProductSearchFilters {
  category?: string;
  priceRange?: { min: number; max: number };
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  gstRate?: number;
  isActive?: boolean;
}

export interface ProductSearchResult extends Product {
  relevanceScore: number;
  matchedFields: string[];
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  profitMargin?: number;
}

export class ProductSearchService {
  private static products: Product[] = [];
  private static lastFetch: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Load products from Firestore with caching
   */
  static async loadProducts(forceRefresh = false): Promise<Product[]> {
    const now = Date.now();
    
    if (!forceRefresh && this.products.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.products;
    }

    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      this.products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      this.lastFetch = now;
      return this.products;
    } catch (error) {
      console.error('Error loading products:', error);
      return this.products; // Return cached products if available
    }
  }

  /**
   * Advanced product search with relevance scoring
   */
  static async searchProducts(
    searchTerm: string,
    filters: ProductSearchFilters = {},
    maxResults = 50
  ): Promise<ProductSearchResult[]> {
    const products = await this.loadProducts();
    
    if (!searchTerm.trim() && Object.keys(filters).length === 0) {
      return this.applyFilters(products, filters)
        .slice(0, maxResults)
        .map(product => this.enhanceProduct(product, []));
    }

    const searchResults = this.performSearch(products, searchTerm);
    const filteredResults = this.applyFilters(searchResults, filters);
    
    return filteredResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }

  /**
   * Get product suggestions based on partial input
   */
  static async getProductSuggestions(
    partialInput: string,
    maxSuggestions = 10
  ): Promise<ProductSearchResult[]> {
    if (partialInput.length < 2) return [];
    
    const products = await this.loadProducts();
    const suggestions: ProductSearchResult[] = [];
    
    for (const product of products) {
      if (suggestions.length >= maxSuggestions) break;
      
      const matchedFields: string[] = [];
      let relevanceScore = 0;
      
      // Check name (highest priority)
      if (product.name.toLowerCase().startsWith(partialInput.toLowerCase())) {
        matchedFields.push('name');
        relevanceScore += 100;
      } else if (product.name.toLowerCase().includes(partialInput.toLowerCase())) {
        matchedFields.push('name');
        relevanceScore += 50;
      }
      
      // Check SKU
      if (product.sku?.toLowerCase().includes(partialInput.toLowerCase())) {
        matchedFields.push('sku');
        relevanceScore += 80;
      }
      
      // Check HSN code
      if (product.hsnCode?.toLowerCase().includes(partialInput.toLowerCase())) {
        matchedFields.push('hsnCode');
        relevanceScore += 70;
      }
      
      if (matchedFields.length > 0) {
        suggestions.push(this.enhanceProduct(product, matchedFields, relevanceScore));
      }
    }
    
    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(categoryId: string): Promise<ProductSearchResult[]> {
    const products = await this.loadProducts();
    
    return products
      .filter(product => product.categoryId === categoryId && product.isActive !== false)
      .map(product => this.enhanceProduct(product, ['category']));
  }

  /**
   * Get recently used products
   */
  static async getRecentProducts(limit = 10): Promise<ProductSearchResult[]> {
    // This would typically come from user's recent activity
    // For now, return most recently created products
    const products = await this.loadProducts();
    
    return products
      .filter(product => product.isActive !== false)
      .sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, limit)
      .map(product => this.enhanceProduct(product, ['recent']));
  }

  /**
   * Get popular products (most frequently used in invoices)
   */
  static async getPopularProducts(limit = 10): Promise<ProductSearchResult[]> {
    // This would typically come from invoice analytics
    // For now, return products with highest stock turnover
    const products = await this.loadProducts();
    
    return products
      .filter(product => product.isActive !== false)
      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      .slice(0, limit)
      .map(product => this.enhanceProduct(product, ['popular']));
  }

  /**
   * Perform fuzzy search on products
   */
  private static performSearch(products: Product[], searchTerm: string): ProductSearchResult[] {
    const results: ProductSearchResult[] = [];
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    for (const product of products) {
      const matchedFields: string[] = [];
      let relevanceScore = 0;
      
      // Name matching (highest priority)
      const nameScore = this.calculateStringMatch(product.name.toLowerCase(), normalizedSearch);
      if (nameScore > 0) {
        matchedFields.push('name');
        relevanceScore += nameScore * 100;
      }
      
      // SKU matching
      if (product.sku) {
        const skuScore = this.calculateStringMatch(product.sku.toLowerCase(), normalizedSearch);
        if (skuScore > 0) {
          matchedFields.push('sku');
          relevanceScore += skuScore * 80;
        }
      }
      
      // HSN code matching
      if (product.hsnCode) {
        const hsnScore = this.calculateStringMatch(product.hsnCode.toLowerCase(), normalizedSearch);
        if (hsnScore > 0) {
          matchedFields.push('hsnCode');
          relevanceScore += hsnScore * 70;
        }
      }
      
      // Description matching
      if (product.description) {
        const descScore = this.calculateStringMatch(product.description.toLowerCase(), normalizedSearch);
        if (descScore > 0) {
          matchedFields.push('description');
          relevanceScore += descScore * 30;
        }
      }
      
      // Barcode matching
      if (product.barcode) {
        const barcodeScore = this.calculateStringMatch(product.barcode.toLowerCase(), normalizedSearch);
        if (barcodeScore > 0) {
          matchedFields.push('barcode');
          relevanceScore += barcodeScore * 90;
        }
      }
      
      if (matchedFields.length > 0) {
        results.push(this.enhanceProduct(product, matchedFields, relevanceScore));
      }
    }
    
    return results;
  }

  /**
   * Calculate string matching score using multiple algorithms
   */
  private static calculateStringMatch(text: string, search: string): number {
    if (text === search) return 1.0;
    if (text.startsWith(search)) return 0.9;
    if (text.includes(search)) return 0.7;
    
    // Fuzzy matching for typos
    const distance = this.levenshteinDistance(text, search);
    const maxLength = Math.max(text.length, search.length);
    const similarity = 1 - (distance / maxLength);
    
    return similarity > 0.6 ? similarity * 0.5 : 0;
  }

  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Apply filters to product list
   */
  private static applyFilters(products: ProductSearchResult[], filters: ProductSearchFilters): ProductSearchResult[] {
    return products.filter(product => {
      // Active status filter
      if (filters.isActive !== undefined && product.isActive !== filters.isActive) {
        return false;
      }
      
      // Category filter
      if (filters.category && product.categoryId !== filters.category) {
        return false;
      }
      
      // Price range filter
      if (filters.priceRange) {
        const price = product.price || 0;
        if (price < filters.priceRange.min || price > filters.priceRange.max) {
          return false;
        }
      }
      
      // Stock status filter
      if (filters.stockStatus) {
        const stockStatus = this.getStockStatus(product);
        if (stockStatus !== filters.stockStatus) {
          return false;
        }
      }
      
      // GST rate filter
      if (filters.gstRate !== undefined && product.gstRate !== filters.gstRate) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Enhance product with additional computed fields
   */
  private static enhanceProduct(
    product: Product, 
    matchedFields: string[], 
    relevanceScore = 0
  ): ProductSearchResult {
    const stockStatus = this.getStockStatus(product);
    const profitMargin = product.costPrice && product.price 
      ? ((product.price - product.costPrice) / product.costPrice) * 100 
      : undefined;
    
    return {
      ...product,
      relevanceScore,
      matchedFields,
      stockStatus,
      profitMargin
    };
  }

  /**
   * Determine stock status
   */
  private static getStockStatus(product: Product): 'in_stock' | 'low_stock' | 'out_of_stock' {
    const quantity = product.quantity || 0;
    const minLevel = product.minStockLevel || 5;
    
    if (quantity === 0) return 'out_of_stock';
    if (quantity <= minLevel) return 'low_stock';
    return 'in_stock';
  }

  /**
   * Get product analytics for better recommendations
   */
  static async getProductAnalytics(productId: string): Promise<{
    totalSales: number;
    averageOrderQuantity: number;
    lastSoldDate?: Date;
    popularWith: string[];
    seasonalTrends?: any;
  }> {
    // This would typically query invoice data
    // For now, return mock data
    return {
      totalSales: 0,
      averageOrderQuantity: 1,
      popularWith: [],
    };
  }

  /**
   * Clear cache (useful for testing or when products are updated)
   */
  static clearCache(): void {
    this.products = [];
    this.lastFetch = 0;
  }
}

export default ProductSearchService;