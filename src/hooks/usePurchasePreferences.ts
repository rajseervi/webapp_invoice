import { useState, useEffect } from 'react';
import { Product } from '@/types/inventory';

interface PurchasePreferences {
  recentProducts: Product[];
  favoriteProducts: string[];
}

export const usePurchasePreferences = () => {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('purchasePreferences');
      if (saved) {
        const preferences: PurchasePreferences = JSON.parse(saved);
        setRecentProducts(preferences.recentProducts || []);
        setFavoriteProducts(preferences.favoriteProducts || []);
      }
    } catch (error) {
      console.error('Error loading purchase preferences:', error);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      const preferences: PurchasePreferences = {
        recentProducts,
        favoriteProducts
      };
      localStorage.setItem('purchasePreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving purchase preferences:', error);
    }
  }, [recentProducts, favoriteProducts]);

  const addRecentProduct = (product: Product) => {
    setRecentProducts(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 10); // Keep only last 10
    });
  };

  const toggleFavoriteProduct = (productId: string) => {
    setFavoriteProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const clearRecentProducts = () => {
    setRecentProducts([]);
  };

  const clearFavoriteProducts = () => {
    setFavoriteProducts([]);
  };

  return {
    recentProducts,
    favoriteProducts,
    addRecentProduct,
    toggleFavoriteProduct,
    clearRecentProducts,
    clearFavoriteProducts
  };
};