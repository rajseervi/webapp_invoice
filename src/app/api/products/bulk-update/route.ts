import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/productService';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle Excel file upload for bulk update
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const updateMode = formData.get('updateMode') as string || 'update'; // 'update' or 'upsert'

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Check file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        return NextResponse.json(
          { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
          { status: 400 }
        );
      }

      // Read file buffer
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return NextResponse.json(
          { error: 'No sheets found in the Excel file' },
          { status: 400 }
        );
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        return NextResponse.json(
          { error: 'No data found in the Excel file' },
          { status: 400 }
        );
      }

      // Process bulk updates
      const results = {
        updated: 0,
        created: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (let i = 0; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        const rowNumber = i + 2;

        try {
          // Check if product exists (by ID or name)
          let existingProduct = null;
          
          if (row.id) {
            existingProduct = await productService.getProductById(row.id);
          } else if (row.name) {
            // Search by name if no ID provided
            const searchResults = await productService.searchProducts(row.name, 1);
            existingProduct = searchResults.find(p => p.name.toLowerCase() === row.name.toLowerCase()) || null;
          }

          if (existingProduct) {
            // Update existing product
            const updateData: any = {};
            
            // Only update fields that are provided in the Excel
            if (row.name !== undefined) updateData.name = String(row.name).trim();
            if (row.categoryId !== undefined) updateData.categoryId = String(row.categoryId).trim();
            if (row.categoryName !== undefined) updateData.categoryName = String(row.categoryName).trim();
            if (row.price !== undefined) updateData.price = Number(row.price);
            if (row.quantity !== undefined) updateData.quantity = Number(row.quantity);
            if (row.description !== undefined) updateData.description = String(row.description);
            if (row.reorderPoint !== undefined) updateData.reorderPoint = Number(row.reorderPoint);
            if (row.isActive !== undefined) updateData.isActive = Boolean(row.isActive);
            if (row.gstRate !== undefined) updateData.gstRate = Number(row.gstRate);
            if (row.hsnCode !== undefined) updateData.hsnCode = String(row.hsnCode);
            if (row.sacCode !== undefined) updateData.sacCode = String(row.sacCode);
            if (row.isService !== undefined) updateData.isService = Boolean(row.isService);
            if (row.gstExempt !== undefined) updateData.gstExempt = Boolean(row.gstExempt);
            if (row.cessRate !== undefined) updateData.cessRate = Number(row.cessRate);
            if (row.unitOfMeasurement !== undefined) updateData.unitOfMeasurement = String(row.unitOfMeasurement);

            await productService.updateProduct(existingProduct.id, updateData);
            results.updated++;
          } else if (updateMode === 'upsert') {
            // Create new product if it doesn't exist and upsert mode is enabled
            if (!row.name || !row.price || row.quantity === undefined) {
              results.errors.push(`Row ${rowNumber}: Missing required fields for new product (name, price, quantity)`);
              results.failed++;
              continue;
            }

            const newProduct = {
              name: String(row.name).trim(),
              categoryId: row.categoryId ? String(row.categoryId).trim() : 'general',
              categoryName: row.categoryName ? String(row.categoryName).trim() : undefined,
              price: Number(row.price),
              quantity: Number(row.quantity),
              description: row.description ? String(row.description) : '',
              reorderPoint: row.reorderPoint ? Number(row.reorderPoint) : 10,
              isActive: row.isActive !== false,
              gstRate: row.gstRate ? Number(row.gstRate) : 18,
              hsnCode: row.hsnCode ? String(row.hsnCode) : '',
              sacCode: row.sacCode ? String(row.sacCode) : '',
              isService: Boolean(row.isService),
              gstExempt: Boolean(row.gstExempt),
              cessRate: row.cessRate ? Number(row.cessRate) : 0,
              unitOfMeasurement: row.unitOfMeasurement ? String(row.unitOfMeasurement) : 'PCS'
            };

            await productService.createProduct(newProduct);
            results.created++;
          } else {
            results.errors.push(`Row ${rowNumber}: Product not found and upsert mode is disabled`);
            results.failed++;
          }
        } catch (error) {
          results.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.failed++;
        }
      }

      return NextResponse.json({
        success: true,
        results,
        message: `Bulk update completed: ${results.updated} updated, ${results.created} created, ${results.failed} failed`
      });

    } else {
      // Handle JSON payload for bulk update by IDs
      const body = await request.json();
      const { productIds, updateData } = body;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return NextResponse.json(
          { error: 'Product IDs are required' },
          { status: 400 }
        );
      }

      if (!updateData || typeof updateData !== 'object') {
        return NextResponse.json(
          { error: 'Update data is required' },
          { status: 400 }
        );
      }

      // Validate update data
      const allowedFields = [
        'price', 'quantity', 'gstRate', 'categoryId', 'categoryName', 
        'isActive', 'reorderPoint', 'description', 'hsnCode', 'sacCode',
        'isService', 'gstExempt', 'cessRate', 'unitOfMeasurement'
      ];

      const filteredUpdateData: any = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdateData[key] = updateData[key];
        }
      });

      if (Object.keys(filteredUpdateData).length === 0) {
        return NextResponse.json(
          { error: 'No valid update fields provided' },
          { status: 400 }
        );
      }

      // Perform bulk update
      await productService.bulkUpdateProducts(productIds, filteredUpdateData);

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${productIds.length} products`,
        updatedCount: productIds.length
      });
    }

  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform bulk update',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to download bulk update template
export async function GET() {
  try {
    // Get some existing products as examples
    const existingProducts = await productService.getProducts({}, undefined, { page: 0, limit: 5 });
    
    const template = existingProducts.products.map(product => ({
      id: product.id, // Include ID for updates
      name: product.name,
      categoryId: product.categoryId,
      categoryName: product.categoryName || '',
      price: product.price,
      quantity: product.quantity,
      description: product.description || '',
      reorderPoint: product.reorderPoint || 10,
      isActive: product.isActive,
      gstRate: product.gstRate || 0,
      hsnCode: product.hsnCode || '',
      sacCode: product.sacCode || '',
      isService: product.isService || false,
      gstExempt: product.gstExempt || false,
      cessRate: product.cessRate || 0,
      unitOfMeasurement: product.unitOfMeasurement || 'PCS'
    }));

    // If no existing products, create sample template
    if (template.length === 0) {
      template.push({
        id: 'SAMPLE_ID_1',
        name: 'Sample Product 1',
        categoryId: 'electronics',
        categoryName: 'Electronics',
        price: 1000,
        quantity: 50,
        description: 'Sample product for bulk update',
        reorderPoint: 10,
        isActive: true,
        gstRate: 18,
        hsnCode: '8517',
        sacCode: '',
        isService: false,
        gstExempt: false,
        cessRate: 0,
        unitOfMeasurement: 'PCS'
      });
    }

    // Create Excel file
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bulk Update Template');

    // Add instructions sheet
    const instructions = [
      { Instruction: 'BULK UPDATE INSTRUCTIONS' },
      { Instruction: '' },
      { Instruction: '1. Keep the "id" column to update existing products' },
      { Instruction: '2. Remove the "id" column or leave it empty to create new products (upsert mode)' },
      { Instruction: '3. Only modify the fields you want to update' },
      { Instruction: '4. Leave fields empty to keep existing values' },
      { Instruction: '5. Upload this file using the bulk update feature' },
      { Instruction: '' },
      { Instruction: 'IMPORTANT NOTES:' },
      { Instruction: '- ID field is used to identify existing products' },
      { Instruction: '- If ID is not found, product will be created (in upsert mode)' },
      { Instruction: '- Price and quantity must be valid numbers' },
      { Instruction: '- GST rate must be between 0-100' },
      { Instruction: '- HSN code required for goods, SAC code for services' }
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return template file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="bulk_update_template.xlsx"',
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate bulk update template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}