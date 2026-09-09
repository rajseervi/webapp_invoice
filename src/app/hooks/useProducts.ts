import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
// Fix the import path to use the correct file extension
import { db } from '@/firebase/config';

export interface Product {
  id: string;
  name: string;
  price: number;
  purchasePrice?: number;
  category: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  stock?: number;
  quantity?: number;
  gstRate?: number;
  hsnCode?: string;
  isActive?: boolean;
}

const MAX_RETRIES = 2;
const RETRY_DELAY = 400; // 400ms — faster retries so UI isn't stuck long

/** Coerce a Firestore value into a safe finite number. Handles string prices
 *  like "1,250", "₹500", or missing/NaN values that would otherwise render ₹NaN. */
function toSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    // Strip currency symbols, commas, and whitespace: "₹1,250" → 1250
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

// ─── Module-level cache ──────────────────────────────────────────────────────
// Products are fetched once per session and shared across all components that
// use this hook. Subsequent mounts get instant data instead of a slow spinner,
// which directly addresses the "full-screen Select Product loads too late" issue.
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute TTL

let cachedProducts: Product[] | null = null;
let cachedCategoryNameMap: Map<string, string> | null = null;
let cacheLoadedAt = 0;

function getCachedProducts(): Product[] {
  const now = Date.now();
  if (cachedProducts && now - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedProducts;
  }
  return [];
}

function getCachedCategoryMap(): Map<string, string> | null {
  const now = Date.now();
  if (cachedCategoryNameMap && now - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedCategoryNameMap;
  }
  return null;
}

function setCaches(products: Product[], categoryMap: Map<string, string>) {
  cachedProducts = products;
  cachedCategoryNameMap = categoryMap;
  cacheLoadedAt = Date.now();
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => getCachedProducts());
  const [loading, setLoading] = useState(() => getCachedProducts().length === 0);
  const [error, setError] = useState<string | null>(null);
  // Track whether the current data came from cache so we can skip the spinner
  const hasCache = useRef(getCachedProducts().length > 0);

  const fetchProductsWithRetry = useCallback(async (retryCount = 0) => {
    // If a fresh cache exists, use it immediately — no need to hit the network.
    const cached = getCachedProducts();
    if (cached.length > 0) {
      setProducts(cached);
      setLoading(false);
      setError(null);
      hasCache.current = true;
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if db is properly initialized
      if (!db) {
        throw new Error('Firebase database is not initialized');
      }

      // Fetch products and categories in parallel. Categories are only needed
      // to resolve categoryId → display name; they're lightweight relative to the
      // product list but still worth fetching in parallel to save a network round-trip.
      const [productsSnapshot, categoriesSnapshot] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'categories'))
      ]);

      // Create a map of category IDs to category names
      const categoryMap = new Map<string, string>();
      categoriesSnapshot.docs.forEach(doc => {
        const categoryData = doc.data();
        categoryMap.set(doc.id, categoryData.name || 'Unknown Category');
      });

      // Map products and resolve category names
      const productsList = productsSnapshot.docs.map(doc => {
        const productData = doc.data();
        let categoryName = '';

        // Try to get category name from categoryId first
        if (productData.categoryId) {
          categoryName = categoryMap.get(productData.categoryId) || '';
        }

        // Fallback to existing category field if categoryName is empty
        if (!categoryName && productData.category) {
          categoryName = productData.category;
        }

        // Fallback to categoryName field if it exists
        if (!categoryName && productData.categoryName) {
          categoryName = productData.categoryName;
        }

        // Final fallback
        if (!categoryName) {
          categoryName = 'Uncategorized';
        }

        return {
          id: doc.id,
          ...productData,
          category: categoryName, // Ensure category field is populated with name
          // Normalize numeric fields so string/missing values can't produce ₹NaN
          price: toSafeNumber(productData.price),
          purchasePrice: toSafeNumber(productData.purchasePrice),
          stock: toSafeNumber(productData.quantity ?? productData.stock), // Handle both stock and quantity fields
        } as Product;
      });

      setProducts(productsList);
      setCaches(productsList, categoryMap);
      hasCache.current = true;
    } catch (err) {
      console.error(`Error fetching products (attempt ${retryCount + 1}):`, err);

      if (retryCount < MAX_RETRIES) {
        // Set a temporary error message during retries
        setError(`Connection issue. Retrying... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);

        setTimeout(() => {
          fetchProductsWithRetry(retryCount + 1);
        }, RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        // Format a more detailed error message
        let errorMessage = 'Failed to fetch products. Please try again later.';

        if (err instanceof Error) {
          // Add the specific error message if available
          errorMessage += ` Error: ${err.message}`;
        }

        setError(errorMessage);
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      // If we already have cached products, don't re-fetch immediately
      if (!hasCache.current) {
        fetchProductsWithRetry();
      }
    } catch (err) {
      console.error('Error initializing products fetch:', err);
      setError('Failed to initialize products fetch. Please refresh the page.');
      setLoading(false);
    }
  }, [fetchProductsWithRetry]);

  const refetch = useCallback(() => {
    try {
      // Force a fresh fetch, busting the cache
      cachedProducts = null;
      cachedCategoryNameMap = null;
      cacheLoadedAt = 0;
      setLoading(true);
      setError(null);
      fetchProductsWithRetry(0);
    } catch (err) {
      console.error('Error during products refetch:', err);
      setError('Failed to refetch products. Please try again.');
      setLoading(false);
    }
  }, [fetchProductsWithRetry]);

  return { products, loading, error, refetch };
}
