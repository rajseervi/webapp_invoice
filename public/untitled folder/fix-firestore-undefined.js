#!/usr/bin/env node

/**
 * Script to fix the Firestore undefined value error
 * This script will update the productService.ts file to handle undefined values properly
 */

const fs = require('fs');
const path = require('path');

const productServicePath = path.join(__dirname, 'src', 'services', 'productService.ts');

// Read the current file
let content = fs.readFileSync(productServicePath, 'utf8');

// Add the cleanDataForFirestore helper function
const helperFunction = `
  // Helper function to clean data for Firestore (remove undefined values)
  cleanDataForFirestore(data: any): any {
    if (data === null || data === undefined) {
      return null;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.cleanDataForFirestore(item));
    }

    if (typeof data === 'object') {
      const cleaned: any = {};
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== undefined) {
          cleaned[key] = this.cleanDataForFirestore(value);
        }
      });
      return cleaned;
    }

    return data;
  },
`;

// Insert the helper function before the getProducts function
content = content.replace(
  /(\s+\/\/ Get all products with optional filtering)/,
  helperFunction + '$1'
);

// Fix the problematic line in importProducts
content = content.replace(
  /categoryName: categoryName \|\| product\.categoryName,.*$/m,
  '// categoryName will be added conditionally below'
);

// Fix the productData creation in importProducts
const oldProductDataPattern = /const productData = \{[\s\S]*?\};/;
const newProductData = `const productData: any = {
          name: product.name,
          categoryId: categoryId,
          price: product.price,
          quantity: product.quantity,
          description: product.description || '',
          reorderPoint: product.reorderPoint ?? 10,
          isActive: product.isActive ?? true,
          gstRate: product.gstRate ?? 18,
          hsnCode: product.hsnCode || '',
          sacCode: product.sacCode || '',
          isService: product.isService ?? false,
          gstExempt: product.gstExempt ?? false,
          cessRate: product.cessRate ?? 0,
          unitOfMeasurement: product.unitOfMeasurement || 'PCS',
          createdAt: now,
          updatedAt: now
        };

        // Only add categoryName if it exists and is not empty
        if (categoryName && categoryName.trim() !== '') {
          productData.categoryName = categoryName.trim();
        }

        // Clean the data to remove any undefined values
        const cleanedProductData = this.cleanDataForFirestore(productData);`;

content = content.replace(oldProductDataPattern, newProductData);

// Fix the batch.set call
content = content.replace(
  /batch\.set\(docRef, productData\);/,
  'batch.set(docRef, cleanedProductData);'
);

// Write the updated content back to the file
fs.writeFileSync(productServicePath, content, 'utf8');

console.log('✅ Fixed Firestore undefined value error in productService.ts');
console.log('The following changes were made:');
console.log('1. Added cleanDataForFirestore helper function');
console.log('2. Fixed productData creation to avoid undefined values');
console.log('3. Updated batch.set to use cleaned data');
console.log('');
console.log('You can now run your import without the undefined value error.');