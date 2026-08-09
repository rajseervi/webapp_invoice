import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

/**
 * Utility function to find or create a category by name
 * This prevents duplicate category creation when creating products
 */
export async function findOrCreateCategory(categoryName: string): Promise<string> {
  if (!categoryName || !categoryName.trim()) {
    return '';
  }

  const trimmedName = categoryName.trim();

  try {
    // First, check if category already exists
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('name', '==', trimmedName)
    );
    const categoriesSnapshot = await getDocs(categoriesQuery);

    if (!categoriesSnapshot.empty) {
      // Category exists, return its ID
      const existingCategory = categoriesSnapshot.docs[0];
      console.log('Found existing category:', existingCategory.id, 'for name:', trimmedName);
      return existingCategory.id;
    }

    // Category doesn't exist, create it
    console.log('Creating new category for name:', trimmedName);
    const categoryData = {
      name: trimmedName,
      description: `Auto-created category for ${trimmedName} products`,
      isActive: true,
      sortOrder: 0,
      color: '#1976d2', // Default color
      icon: 'category', // Default icon
      tags: [],
      metadata: {
        totalProducts: 0,
        totalValue: 0,
        averagePrice: 0,
        lastUpdated: new Date().toISOString()
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const categoryRef = await addDoc(collection(db, 'categories'), categoryData);
    console.log('Created new category:', categoryRef.id, 'for name:', trimmedName);
    return categoryRef.id;

  } catch (error) {
    console.error('Error finding or creating category:', error);
    // Return empty string if there's an error
    return '';
  }
}

/**
 * Utility function to get category name by ID
 */
export async function getCategoryNameById(categoryId: string): Promise<string> {
  if (!categoryId) return '';

  try {
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('__name__', '==', categoryId)
    );
    const categoriesSnapshot = await getDocs(categoriesQuery);

    if (!categoriesSnapshot.empty) {
      const category = categoriesSnapshot.docs[0].data();
      return category.name || '';
    }

    return '';
  } catch (error) {
    console.error('Error getting category name:', error);
    return '';
  }
}

/**
 * Utility function to validate category data before creation
 */
export function validateCategoryName(categoryName: string): { isValid: boolean; error?: string } {
  if (!categoryName || !categoryName.trim()) {
    return { isValid: false, error: 'Category name cannot be empty' };
  }

  const trimmedName = categoryName.trim();

  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Category name must be at least 2 characters long' };
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Category name cannot exceed 50 characters' };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"\/\\|?*]/;
  if (invalidChars.test(trimmedName)) {
    return { isValid: false, error: 'Category name contains invalid characters' };
  }

  return { isValid: true };
}