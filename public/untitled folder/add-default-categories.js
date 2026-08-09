// This script adds default categories to help with testing
// Run this in the browser console on your app's page

const defaultCategories = [
  {
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    isActive: true,
    defaultDiscount: 0,
    defaultGstRate: 18,
    color: '#2196F3',
    icon: 'computer',
    tags: ['electronics', 'devices', 'technology']
  },
  {
    name: 'Clothing',
    description: 'Apparel and fashion items',
    isActive: true,
    defaultDiscount: 0,
    defaultGstRate: 12,
    color: '#E91E63',
    icon: 'checkroom',
    tags: ['clothing', 'fashion', 'apparel']
  },
  {
    name: 'Food & Beverages',
    description: 'Food items and beverages',
    isActive: true,
    defaultDiscount: 0,
    defaultGstRate: 5,
    color: '#4CAF50',
    icon: 'restaurant',
    tags: ['food', 'beverages', 'consumables']
  },
  {
    name: 'Books',
    description: 'Books and educational materials',
    isActive: true,
    defaultDiscount: 0,
    defaultGstRate: 12,
    color: '#FF9800',
    icon: 'book',
    tags: ['books', 'education', 'reading']
  },
  {
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies',
    isActive: true,
    defaultDiscount: 0,
    defaultGstRate: 18,
    color: '#795548',
    icon: 'home',
    tags: ['home', 'garden', 'improvement']
  },
  {
    name: 'Services',
    description: 'Professional and personal services',
    isActive: true,
    defaultDiscount: 0,
    defaultGstRate: 18,
    color: '#9C27B0',
    icon: 'build',
    tags: ['services', 'professional', 'consulting']
  }
];

async function addDefaultCategories() {
  try {
    // Import Firebase functions (assuming they're available globally)
    const { collection, addDoc, getDocs, serverTimestamp } = window.firebase.firestore;
    const db = window.firebase.firestore();
    
    // Check existing categories
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const existingCategories = categoriesSnapshot.docs.map(doc => doc.data().name);
    
    console.log('Existing categories:', existingCategories);
    
    // Add categories that don't exist
    for (const category of defaultCategories) {
      if (!existingCategories.includes(category.name)) {
        const categoryData = {
          ...category,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          metadata: {
            totalProducts: 0,
            totalValue: 0,
            averagePrice: 0,
            lastUpdated: new Date().toISOString()
          }
        };
        
        const docRef = await addDoc(collection(db, 'categories'), categoryData);
        console.log(`Added category: ${category.name} with ID: ${docRef.id}`);
      } else {
        console.log(`Category already exists: ${category.name}`);
      }
    }
    
    console.log('Default categories setup completed!');
  } catch (error) {
    console.error('Error adding default categories:', error);
  }
}

// Instructions for manual execution
console.log('To add default categories, run: addDefaultCategories()');
console.log('Make sure you are on a page where Firebase is loaded and authenticated.');

// Export for manual execution
window.addDefaultCategories = addDefaultCategories;