import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/productService';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'xlsx';
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const categoryId = searchParams.get('categoryId');

    // Build filters based on query parameters
    const filters: any = {};
    
    if (!includeInactive) {
      filters.status = 'active';
    }
    
    if (categoryId) {
      filters.category = categoryId;
    }

    // Get products from the service
    const products = await productService.exportProducts(filters);

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products found to export' },
        { status: 404 }
      );
    }

    // Prepare export data with all relevant fields
    const exportData = products.map(product => ({
      id: product.id,
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
      unitOfMeasurement: product.unitOfMeasurement || 'PCS',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData,
        count: exportData.length
      });
    }

    // Create Excel file
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `products_export_${timestamp}.xlsx`;

    // Return file as response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds, format = 'xlsx' } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      );
    }

    // Get specific products by IDs
    const products = await productService.getProductsByIds(productIds);

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products found with the provided IDs' },
        { status: 404 }
      );
    }

    // Prepare export data
    const exportData = products.map(product => ({
      id: product.id,
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
      unitOfMeasurement: product.unitOfMeasurement || 'PCS',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData,
        count: exportData.length
      });
    }

    // Create Excel file
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `selected_products_export_${timestamp}.xlsx`;

    // Return file as response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export selected products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}