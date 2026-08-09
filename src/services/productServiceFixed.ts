// Fixed import function for productService.ts
// This function should replace the existing importProducts function

// Helper function to clean data for Firestore (remove undefined values)
function cleanDataForFirestore(data: any): any {
  const cleaned: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      cleaned[key] = data[key];
    }
  });
  return cleaned;
}

// Import products from array
async function importProducts(products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < products.length; i++) {
      try {
        const product = products[i];

        // Validate required fields
        if (!product.name) {
          errors.push(`Row ${i + 1}: Missing required field 'name'`);
          failed++;
          continue;
        }

        let categoryId = product.categoryId;
        let categoryName = product.categoryName;

        // If categoryName is provided but categoryId is not, try to find or create the category
        if (categoryName && !categoryId) {
          const existingCategories = await categoryService.getCategories();
          const existingCategory = existingCategories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());

          if (existingCategory) {
            categoryId = existingCategory.id;
          } else {
            try {
              // Create new category if it doesn't exist
              categoryId = await categoryService.createCategory({
                name: categoryName,
                isActive: true,
                description: '',
                defaultDiscount: 0
              });
              console.log(`Created new category: ${categoryName} with ID: ${categoryId}`);
            } catch (catError) {
              errors.push(`Row ${i + 1}: Failed to create category '${categoryName}': ${catError instanceof Error ? catError.message : 'Unknown error'}`);
              failed++;
              continue;
            }
          }
        }

        // If after all attempts, categoryId is still missing, skip this product
        if (!categoryId) {
          errors.push(`Row ${i + 1}: Missing or invalid category information (categoryId or categoryName)`);
          failed++;
          continue;
        }

        // Prepare product data with proper defaults and clean undefined values
        const productData: any = {
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
        const cleanedProductData = cleanDataForFirestore(productData);

        const docRef = doc(collection(db, 'products'));
        batch.set(docRef, cleanedProductData);
        success++;

        // Commit in batches of 500 (Firestore limit)
        if (success % 500 === 0) {
          await batch.commit();
        }
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    // Commit remaining items
    if (success % 500 !== 0) {
      await batch.commit();
    }

    return { success, failed, errors };
  } catch (error) {
    console.error('Error importing products:', error);
    throw error;
  }
}