import * as XLSX from 'xlsx';
import { HSNSummaryReport, HSNCategoryReport, StockReport, DataQualityReport } from '@/types/reports';

export class ReportUtils {
  
  // Export HSN Summary to Excel
  static exportHSNSummaryToExcel(data: HSNSummaryReport[], filename?: string) {
    const exportData = data.map(item => ({
      'HSN Code': item.hsnCode,
      'Description': item.description,
      'Category': item.category,
      'GST Rate (%)': item.gstRate,
      'Total Sales': item.totalSales,
      'Total Purchases': item.totalPurchases,
      'Total Quantity': item.totalQuantity,
      'Taxable Amount': item.totalTaxableAmount,
      'CGST': item.totalCgst,
      'SGST': item.totalSgst,
      'IGST': item.totalIgst,
      'Total Tax': item.totalTaxAmount,
      'Net Value': item.netValue,
      'Stock Quantity': item.stockQuantity,
      'Stock Value': item.stockValue,
      'Avg Selling Price': item.averageSellingPrice,
      'Avg Purchase Price': item.averagePurchasePrice,
      'Profit Margin (%)': item.profitMargin.toFixed(2),
      'Transaction Count': item.transactionCount
    }));

    this.exportToExcel(exportData, filename || `HSN_Summary_${this.getDateString()}.xlsx`);
  }

  // Export Category Report to Excel
  static exportCategoryReportToExcel(data: HSNCategoryReport[], filename?: string) {
    const exportData = data.map(item => ({
      'Category': item.category,
      'HSN Codes': item.hsnCodes.join(', '),
      'Total Products': item.totalProducts,
      'Total Sales': item.totalSales,
      'Total Purchases': item.totalPurchases,
      'Total Stock': item.totalStock,
      'Stock Value': item.totalStockValue,
      'Tax Collected': item.totalTaxCollected,
      'Tax Paid': item.totalTaxPaid,
      'Net Tax Liability': item.netTaxLiability,
      'Profit Margin (%)': item.profitMargin.toFixed(2)
    }));

    this.exportToExcel(exportData, filename || `Category_Report_${this.getDateString()}.xlsx`);
  }

  // Export Stock Report to Excel
  static exportStockReportToExcel(data: StockReport[], filename?: string) {
    const exportData = data.map(item => ({
      'Product ID': item.productId,
      'Product Name': item.productName,
      'HSN Code': item.hsnCode,
      'Category': item.category,
      'Current Stock': item.currentStock,
      'Stock Value': item.stockValue,
      'Reorder Point': item.reorderPoint,
      'Max Stock Level': item.maxStockLevel,
      'Min Stock Level': item.minStockLevel,
      'Average Cost': item.averageCost,
      'Last Purchase Price': item.lastPurchasePrice,
      'Last Sale Price': item.lastSalePrice,
      'Stock Status': item.stockStatus,
      'Days of Stock': item.daysOfStock,
      'Turnover Ratio': item.turnoverRatio,
      'Total Sales': item.totalSales,
      'Total Purchases': item.totalPurchases
    }));

    this.exportToExcel(exportData, filename || `Stock_Report_${this.getDateString()}.xlsx`);
  }

  // Export Data Quality Report to Excel
  static exportDataQualityReportToExcel(data: DataQualityReport, filename?: string) {
    // Summary sheet
    const summaryData = [{
      'Total Records': data.totalRecords,
      'Valid Records': data.validRecords,
      'Invalid Records': data.invalidRecords,
      'Missing HSN Codes': data.missingHsnCodes,
      'Incorrect GST Rates': data.incorrectGstRates,
      'Incomplete Product Info': data.incompleteProductInfo,
      'Data Inconsistencies': data.dataInconsistencies,
      'Quality Score (%)': ((data.validRecords / data.totalRecords) * 100).toFixed(2)
    }];

    // Issues sheet
    const issuesData = data.issues.map((issue, index) => ({
      'Issue #': index + 1,
      'Type': issue.type,
      'Record': issue.record,
      'Description': issue.description,
      'Suggested Fix': issue.suggestedFix
    }));

    const workbook = XLSX.utils.book_new();
    
    // Add summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Add issues sheet
    const issuesSheet = XLSX.utils.json_to_sheet(issuesData);
    XLSX.utils.book_append_sheet(workbook, issuesSheet, 'Issues');

    // Save file
    XLSX.writeFile(workbook, filename || `Data_Quality_Report_${this.getDateString()}.xlsx`);
  }

  // Generic Excel export function
  private static exportToExcel(data: any[], filename: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    
    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
    }));
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, filename);
  }

  // Generate data comparison report
  static generateComparisonReport(
    currentPeriodData: HSNSummaryReport[],
    previousPeriodData: HSNSummaryReport[],
    filename?: string
  ) {
    const previousMap = new Map(previousPeriodData.map(item => [item.hsnCode, item]));
    
    const comparisonData = currentPeriodData.map(current => {
      const previous = previousMap.get(current.hsnCode);
      
      return {
        'HSN Code': current.hsnCode,
        'Description': current.description,
        'Category': current.category,
        'Current Sales': current.totalSales,
        'Previous Sales': previous?.totalSales || 0,
        'Sales Growth': previous ? 
          (((current.totalSales - previous.totalSales) / previous.totalSales) * 100).toFixed(2) + '%' : 
          'New',
        'Current Stock': current.stockQuantity,
        'Previous Stock': previous?.stockQuantity || 0,
        'Stock Change': current.stockQuantity - (previous?.stockQuantity || 0),
        'Current Margin (%)': current.profitMargin.toFixed(2),
        'Previous Margin (%)': previous?.profitMargin.toFixed(2) || 'N/A',
        'Margin Change': previous ? 
          (current.profitMargin - previous.profitMargin).toFixed(2) + '%' : 
          'N/A'
      };
    });

    this.exportToExcel(comparisonData, filename || `Period_Comparison_${this.getDateString()}.xlsx`);
  }

  // Generate HSN-wise GST summary for filing
  static generateGSTFilingSummary(data: HSNSummaryReport[], filename?: string) {
    const gstSummary = data.map(item => ({
      'HSN Code': item.hsnCode,
      'HSN Description': item.description,
      'UQC': 'PCS', // This should come from product data
      'Total Quantity': item.totalQuantity,
      'Total Value': item.totalTaxableAmount,
      'Taxable Value': item.totalTaxableAmount,
      'Integrated Tax Amount': item.totalIgst,
      'Central Tax Amount': item.totalCgst,
      'State/UT Tax Amount': item.totalSgst,
      'Cess Amount': 0 // This should be calculated if cess is applicable
    }));

    const summarySheet = data.reduce((acc, item) => {
      const rate = item.gstRate;
      if (!acc[rate]) {
        acc[rate] = {
          'GST Rate (%)': rate,
          'Taxable Value': 0,
          'IGST': 0,
          'CGST': 0,
          'SGST': 0
        };
      }
      acc[rate]['Taxable Value'] += item.totalTaxableAmount;
      acc[rate]['IGST'] += item.totalIgst;
      acc[rate]['CGST'] += item.totalCgst;
      acc[rate]['SGST'] += item.totalSgst;
      return acc;
    }, {} as any);

    const workbook = XLSX.utils.book_new();
    
    // HSN-wise details
    const detailSheet = XLSX.utils.json_to_sheet(gstSummary);
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'HSN Details');
    
    // Rate-wise summary
    const summaryData = Object.values(summarySheet);
    const summarySheetWS = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheetWS, 'Rate Summary');

    XLSX.writeFile(workbook, filename || `GST_Filing_Summary_${this.getDateString()}.xlsx`);
  }

  // Utility function to get formatted date string
  private static getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Generate stock reorder report
  static generateReorderReport(stockData: StockReport[], filename?: string) {
    const reorderData = stockData
      .filter(item => item.stockStatus === 'low_stock' || item.stockStatus === 'out_of_stock')
      .map(item => ({
        'Product Name': item.productName,
        'HSN Code': item.hsnCode,
        'Category': item.category,
        'Current Stock': item.currentStock,
        'Reorder Point': item.reorderPoint,
        'Suggested Order Qty': Math.max(item.maxStockLevel - item.currentStock, item.reorderPoint),
        'Days of Stock': item.daysOfStock,
        'Last Purchase Price': item.lastPurchasePrice,
        'Estimated Cost': (Math.max(item.maxStockLevel - item.currentStock, item.reorderPoint)) * item.lastPurchasePrice,
        'Status': item.stockStatus.replace('_', ' ').toUpperCase(),
        'Priority': item.stockStatus === 'out_of_stock' ? 'HIGH' : 
                   item.daysOfStock < 7 ? 'MEDIUM' : 'LOW'
      }))
      .sort((a, b) => {
        const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return priorityOrder[b.Priority as keyof typeof priorityOrder] - priorityOrder[a.Priority as keyof typeof priorityOrder];
      });

    this.exportToExcel(reorderData, filename || `Reorder_Report_${this.getDateString()}.xlsx`);
  }

  // Generate ABC analysis report
  static generateABCAnalysisReport(hsnData: HSNSummaryReport[], filename?: string) {
    // Sort by sales value
    const sortedData = [...hsnData].sort((a, b) => b.totalSales - a.totalSales);
    
    const totalSales = sortedData.reduce((sum, item) => sum + item.totalSales, 0);
    let cumulativePercentage = 0;
    
    const abcData = sortedData.map((item, index) => {
      const percentage = (item.totalSales / totalSales) * 100;
      cumulativePercentage += percentage;
      
      let category = 'C';
      if (cumulativePercentage <= 80) category = 'A';
      else if (cumulativePercentage <= 95) category = 'B';
      
      return {
        'Rank': index + 1,
        'HSN Code': item.hsnCode,
        'Description': item.description,
        'Category': item.category,
        'Sales Value': item.totalSales,
        'Sales %': percentage.toFixed(2),
        'Cumulative %': cumulativePercentage.toFixed(2),
        'ABC Category': category,
        'Stock Value': item.stockValue,
        'Turnover': item.totalSales > 0 ? (item.stockValue / item.totalSales).toFixed(2) : 'N/A',
        'Management Focus': category === 'A' ? 'High' : category === 'B' ? 'Medium' : 'Low'
      };
    });

    this.exportToExcel(abcData, filename || `ABC_Analysis_${this.getDateString()}.xlsx`);
  }
}

export default ReportUtils;