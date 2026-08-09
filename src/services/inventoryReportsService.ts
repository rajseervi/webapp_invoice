import { db } from '@/firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  endBefore
} from 'firebase/firestore';
import { Product } from '@/types/inventory';
import { EnhancedStockMovement } from '@/services/enhancedInventoryTrackingService';

export interface InventoryReport {
  id: string;
  reportType: 'stock_valuation' | 'movement_summary' | 'abc_analysis' | 'aging_report' | 'reorder_report' | 'variance_report';
  title: string;
  description: string;
  generatedAt: string;
  generatedBy?: string;
  parameters: {
    dateRange?: { startDate: string; endDate: string };
    productIds?: string[];
    categories?: string[];
    locations?: string[];
    includeInactive?: boolean;
  };
  data: any;
  summary: {
    totalProducts: number;
    totalValue: number;
    totalMovements?: number;
    keyInsights: string[];
  };
}

export interface StockValuationReport {
  products: Array<{
    productId: string;
    productName: string;
    sku?: string;
    category?: string;
    currentQuantity: number;
    unitCost: number;
    totalValue: number;
    lastMovementDate?: string;
    location?: string;
  }>;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
    averageUnitCost: number;
    byCategory: Record<string, { quantity: number; value: number }>;
    byLocation: Record<string, { quantity: number; value: number }>;
  };
}

export interface MovementSummaryReport {
  movements: Array<{
    date: string;
    inboundQuantity: number;
    outboundQuantity: number;
    adjustments: number;
    netMovement: number;
    inboundValue: number;
    outboundValue: number;
    adjustmentValue: number;
    netValue: number;
  }>;
  productMovements: Array<{
    productId: string;
    productName: string;
    totalInbound: number;
    totalOutbound: number;
    totalAdjustments: number;
    netMovement: number;
    movementCount: number;
    averageMovementSize: number;
  }>;
  summary: {
    totalMovements: number;
    totalInbound: number;
    totalOutbound: number;
    totalAdjustments: number;
    netMovement: number;
    mostActiveProducts: Array<{ productId: string; productName: string; movementCount: number }>;
    movementTrends: Array<{ period: string; movements: number; trend: 'up' | 'down' | 'stable' }>;
  };
}

export interface ABCAnalysisReport {
  products: Array<{
    productId: string;
    productName: string;
    annualUsage: number;
    unitCost: number;
    annualValue: number;
    cumulativeValue: number;
    cumulativePercentage: number;
    classification: 'A' | 'B' | 'C';
    recommendedStockLevel: number;
    currentStockLevel: number;
    stockStatus: 'optimal' | 'overstock' | 'understock';
  }>;
  summary: {
    classA: { count: number; percentage: number; value: number; valuePercentage: number };
    classB: { count: number; percentage: number; value: number; valuePercentage: number };
    classC: { count: number; percentage: number; value: number; valuePercentage: number };
    recommendations: string[];
  };
}

export interface AgingReport {
  products: Array<{
    productId: string;
    productName: string;
    currentQuantity: number;
    unitCost: number;
    totalValue: number;
    lastMovementDate: string;
    daysSinceLastMovement: number;
    agingCategory: '0-30' | '31-60' | '61-90' | '91-180' | '180+';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendedAction: string;
  }>;
  summary: {
    totalValue: number;
    byAgingCategory: Record<string, { count: number; value: number; percentage: number }>;
    riskAnalysis: {
      lowRisk: { count: number; value: number };
      mediumRisk: { count: number; value: number };
      highRisk: { count: number; value: number };
      criticalRisk: { count: number; value: number };
    };
    recommendations: string[];
  };
}

export interface ReorderReport {
  products: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    maxStockLevel: number;
    reorderQuantity: number;
    leadTimeDays: number;
    averageDailyUsage: number;
    daysOfStock: number;
    stockStatus: 'critical' | 'low' | 'optimal' | 'high' | 'overstock';
    reorderUrgency: 'immediate' | 'within_week' | 'within_month' | 'not_needed';
    estimatedStockoutDate?: string;
    suggestedOrderQuantity: number;
    estimatedOrderCost: number;
  }>;
  summary: {
    totalProducts: number;
    criticalStock: number;
    lowStock: number;
    overstock: number;
    totalReorderValue: number;
    urgentReorders: number;
    recommendations: string[];
  };
}

export interface VarianceReport {
  variances: Array<{
    productId: string;
    productName: string;
    expectedQuantity: number;
    actualQuantity: number;
    variance: number;
    variancePercentage: number;
    varianceValue: number;
    varianceType: 'positive' | 'negative';
    possibleCauses: string[];
    lastCountDate: string;
    countedBy?: string;
  }>;
  summary: {
    totalVariances: number;
    positiveVariances: { count: number; value: number };
    negativeVariances: { count: number; value: number };
    netVariance: { quantity: number; value: number };
    accuracyRate: number;
    majorVariances: number; // Variances > 10%
    recommendations: string[];
  };
}

export class InventoryReportsService {
  private static readonly PRODUCTS_COLLECTION = 'products';
  private static readonly MOVEMENTS_COLLECTION = 'enhanced_stock_movements';
  private static readonly REPORTS_COLLECTION = 'inventory_reports';

  /**
   * Generate stock valuation report
   */
  static async generateStockValuationReport(
    parameters: {
      dateRange?: { startDate: string; endDate: string };
      productIds?: string[];
      categories?: string[];
      locations?: string[];
      includeInactive?: boolean;
    } = {}
  ): Promise<StockValuationReport> {
    try {
      // Get products
      let productsQuery = collection(db, this.PRODUCTS_COLLECTION);
      
      if (parameters.productIds && parameters.productIds.length > 0) {
        productsQuery = query(productsQuery, where('__name__', 'in', parameters.productIds)) as any;
      }

      const productsSnapshot = await getDocs(productsQuery);
      let products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // Apply filters
      if (parameters.categories && parameters.categories.length > 0) {
        products = products.filter(p => parameters.categories!.includes(p.category || ''));
      }

      if (!parameters.includeInactive) {
        products = products.filter(p => p.isActive !== false);
      }

      // Calculate valuation
      const reportProducts = products.map(product => ({
        productId: product.id!,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        currentQuantity: product.quantity || 0,
        unitCost: product.purchasePrice || product.price || 0,
        totalValue: (product.quantity || 0) * (product.purchasePrice || product.price || 0),
        lastMovementDate: product.updatedAt,
        location: product.location
      }));

      // Calculate summary
      const totalProducts = reportProducts.length;
      const totalQuantity = reportProducts.reduce((sum, p) => sum + p.currentQuantity, 0);
      const totalValue = reportProducts.reduce((sum, p) => sum + p.totalValue, 0);
      const averageUnitCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

      // Group by category
      const byCategory: Record<string, { quantity: number; value: number }> = {};
      reportProducts.forEach(product => {
        const category = product.category || 'Uncategorized';
        if (!byCategory[category]) {
          byCategory[category] = { quantity: 0, value: 0 };
        }
        byCategory[category].quantity += product.currentQuantity;
        byCategory[category].value += product.totalValue;
      });

      // Group by location
      const byLocation: Record<string, { quantity: number; value: number }> = {};
      reportProducts.forEach(product => {
        const location = product.location || 'Default';
        if (!byLocation[location]) {
          byLocation[location] = { quantity: 0, value: 0 };
        }
        byLocation[location].quantity += product.currentQuantity;
        byLocation[location].value += product.totalValue;
      });

      return {
        products: reportProducts,
        summary: {
          totalProducts,
          totalQuantity,
          totalValue,
          averageUnitCost,
          byCategory,
          byLocation
        }
      };

    } catch (error) {
      console.error('Error generating stock valuation report:', error);
      throw error;
    }
  }

  /**
   * Generate movement summary report
   */
  static async generateMovementSummaryReport(
    parameters: {
      dateRange: { startDate: string; endDate: string };
      productIds?: string[];
      groupBy?: 'day' | 'week' | 'month';
    }
  ): Promise<MovementSummaryReport> {
    try {
      // Get movements in date range
      let movementsQuery = query(
        collection(db, this.MOVEMENTS_COLLECTION),
        where('createdAt', '>=', parameters.dateRange.startDate),
        where('createdAt', '<=', parameters.dateRange.endDate),
        orderBy('createdAt', 'asc')
      );

      const movementsSnapshot = await getDocs(movementsQuery);
      let movements = movementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EnhancedStockMovement[];

      // Filter by products if specified
      if (parameters.productIds && parameters.productIds.length > 0) {
        movements = movements.filter(m => parameters.productIds!.includes(m.productId));
      }

      // Group movements by date
      const groupBy = parameters.groupBy || 'day';
      const movementsByDate = new Map<string, {
        inboundQuantity: number;
        outboundQuantity: number;
        adjustments: number;
        inboundValue: number;
        outboundValue: number;
        adjustmentValue: number;
      }>();

      movements.forEach(movement => {
        let dateKey: string;
        const date = new Date(movement.createdAt);
        
        switch (groupBy) {
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            dateKey = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            dateKey = date.toISOString().split('T')[0];
        }

        if (!movementsByDate.has(dateKey)) {
          movementsByDate.set(dateKey, {
            inboundQuantity: 0,
            outboundQuantity: 0,
            adjustments: 0,
            inboundValue: 0,
            outboundValue: 0,
            adjustmentValue: 0
          });
        }

        const dayData = movementsByDate.get(dateKey)!;
        const value = movement.totalCost || 0;

        switch (movement.movementType) {
          case 'in':
            dayData.inboundQuantity += movement.quantity;
            dayData.inboundValue += value;
            break;
          case 'out':
            dayData.outboundQuantity += movement.quantity;
            dayData.outboundValue += value;
            break;
          case 'adjustment':
            dayData.adjustments += movement.quantity;
            dayData.adjustmentValue += value;
            break;
        }
      });

      // Convert to array and calculate net movements
      const dailyMovements = Array.from(movementsByDate.entries()).map(([date, data]) => ({
        date,
        ...data,
        netMovement: data.inboundQuantity - data.outboundQuantity + data.adjustments,
        netValue: data.inboundValue - data.outboundValue + data.adjustmentValue
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Group movements by product
      const productMovements = new Map<string, {
        productName: string;
        inbound: number;
        outbound: number;
        adjustments: number;
        count: number;
      }>();

      movements.forEach(movement => {
        if (!productMovements.has(movement.productId)) {
          productMovements.set(movement.productId, {
            productName: movement.productName,
            inbound: 0,
            outbound: 0,
            adjustments: 0,
            count: 0
          });
        }

        const productData = productMovements.get(movement.productId)!;
        productData.count++;

        switch (movement.movementType) {
          case 'in':
            productData.inbound += movement.quantity;
            break;
          case 'out':
            productData.outbound += movement.quantity;
            break;
          case 'adjustment':
            productData.adjustments += movement.quantity;
            break;
        }
      });

      const productMovementArray = Array.from(productMovements.entries()).map(([productId, data]) => ({
        productId,
        productName: data.productName,
        totalInbound: data.inbound,
        totalOutbound: data.outbound,
        totalAdjustments: data.adjustments,
        netMovement: data.inbound - data.outbound + data.adjustments,
        movementCount: data.count,
        averageMovementSize: data.count > 0 ? (data.inbound + data.outbound + Math.abs(data.adjustments)) / data.count : 0
      }));

      // Calculate summary
      const totalMovements = movements.length;
      const totalInbound = movements.filter(m => m.movementType === 'in').reduce((sum, m) => sum + m.quantity, 0);
      const totalOutbound = movements.filter(m => m.movementType === 'out').reduce((sum, m) => sum + m.quantity, 0);
      const totalAdjustments = movements.filter(m => m.movementType === 'adjustment').reduce((sum, m) => sum + m.quantity, 0);
      const netMovement = totalInbound - totalOutbound + totalAdjustments;

      const mostActiveProducts = productMovementArray
        .sort((a, b) => b.movementCount - a.movementCount)
        .slice(0, 10)
        .map(p => ({ productId: p.productId, productName: p.productName, movementCount: p.movementCount }));

      // Calculate trends (simplified)
      const movementTrends = dailyMovements.map((current, index) => {
        if (index === 0) return { period: current.date, movements: current.netMovement, trend: 'stable' as const };
        
        const previous = dailyMovements[index - 1];
        const trend = current.netMovement > previous.netMovement ? 'up' : 
                     current.netMovement < previous.netMovement ? 'down' : 'stable';
        
        return { period: current.date, movements: current.netMovement, trend };
      });

      return {
        movements: dailyMovements,
        productMovements: productMovementArray,
        summary: {
          totalMovements,
          totalInbound,
          totalOutbound,
          totalAdjustments,
          netMovement,
          mostActiveProducts,
          movementTrends
        }
      };

    } catch (error) {
      console.error('Error generating movement summary report:', error);
      throw error;
    }
  }

  /**
   * Generate ABC Analysis report
   */
  static async generateABCAnalysisReport(
    parameters: {
      analysisType?: 'usage' | 'value';
      periodMonths?: number;
    } = {}
  ): Promise<ABCAnalysisReport> {
    try {
      const analysisType = parameters.analysisType || 'value';
      const periodMonths = parameters.periodMonths || 12;
      
      // Get products
      const productsSnapshot = await getDocs(collection(db, this.PRODUCTS_COLLECTION));
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // Get movements for the analysis period
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - periodMonths);
      
      const movementsQuery = query(
        collection(db, this.MOVEMENTS_COLLECTION),
        where('createdAt', '>=', startDate.toISOString()),
        where('movementType', '==', 'out') // Only outbound movements for usage analysis
      );

      const movementsSnapshot = await getDocs(movementsQuery);
      const movements = movementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EnhancedStockMovement[];

      // Calculate annual usage for each product
      const productUsage = new Map<string, number>();
      movements.forEach(movement => {
        const current = productUsage.get(movement.productId) || 0;
        productUsage.set(movement.productId, current + movement.quantity);
      });

      // Annualize the usage
      const annualizationFactor = 12 / periodMonths;

      // Create analysis data
      const analysisData = products.map(product => {
        const annualUsage = (productUsage.get(product.id!) || 0) * annualizationFactor;
        const unitCost = product.purchasePrice || product.price || 0;
        const annualValue = annualUsage * unitCost;

        return {
          productId: product.id!,
          productName: product.name,
          annualUsage,
          unitCost,
          annualValue,
          currentStockLevel: product.quantity || 0
        };
      });

      // Sort by analysis criteria
      const sortedData = analysisData.sort((a, b) => {
        return analysisType === 'usage' ? b.annualUsage - a.annualUsage : b.annualValue - a.annualValue;
      });

      // Calculate cumulative values
      const totalValue = sortedData.reduce((sum, item) => sum + item.annualValue, 0);
      let cumulativeValue = 0;

      const classifiedData = sortedData.map(item => {
        cumulativeValue += item.annualValue;
        const cumulativePercentage = totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 0;

        // ABC Classification
        let classification: 'A' | 'B' | 'C';
        if (cumulativePercentage <= 80) {
          classification = 'A';
        } else if (cumulativePercentage <= 95) {
          classification = 'B';
        } else {
          classification = 'C';
        }

        // Stock level recommendations
        const recommendedStockLevel = this.calculateRecommendedStockLevel(item, classification);
        const stockStatus = this.determineStockStatus(item.currentStockLevel, recommendedStockLevel);

        return {
          ...item,
          cumulativeValue,
          cumulativePercentage,
          classification,
          recommendedStockLevel,
          stockStatus
        };
      });

      // Calculate summary
      const classA = classifiedData.filter(item => item.classification === 'A');
      const classB = classifiedData.filter(item => item.classification === 'B');
      const classC = classifiedData.filter(item => item.classification === 'C');

      const summary = {
        classA: {
          count: classA.length,
          percentage: (classA.length / classifiedData.length) * 100,
          value: classA.reduce((sum, item) => sum + item.annualValue, 0),
          valuePercentage: (classA.reduce((sum, item) => sum + item.annualValue, 0) / totalValue) * 100
        },
        classB: {
          count: classB.length,
          percentage: (classB.length / classifiedData.length) * 100,
          value: classB.reduce((sum, item) => sum + item.annualValue, 0),
          valuePercentage: (classB.reduce((sum, item) => sum + item.annualValue, 0) / totalValue) * 100
        },
        classC: {
          count: classC.length,
          percentage: (classC.length / classifiedData.length) * 100,
          value: classC.reduce((sum, item) => sum + item.annualValue, 0),
          valuePercentage: (classC.reduce((sum, item) => sum + item.annualValue, 0) / totalValue) * 100
        },
        recommendations: [
          `Class A items (${classA.length}) represent ${summary.classA.valuePercentage.toFixed(1)}% of total value - require tight control`,
          `Class B items (${classB.length}) need moderate control and regular review`,
          `Class C items (${classC.length}) can be managed with simple controls and bulk ordering`,
          `Focus inventory management efforts on Class A items for maximum impact`
        ]
      };

      return {
        products: classifiedData,
        summary
      };

    } catch (error) {
      console.error('Error generating ABC analysis report:', error);
      throw error;
    }
  }

  /**
   * Generate aging report
   */
  static async generateAgingReport(): Promise<AgingReport> {
    try {
      // Get products
      const productsSnapshot = await getDocs(collection(db, this.PRODUCTS_COLLECTION));
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // Get latest movement for each product
      const productLastMovement = new Map<string, string>();
      
      for (const product of products) {
        const movementsQuery = query(
          collection(db, this.MOVEMENTS_COLLECTION),
          where('productId', '==', product.id),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        
        const movementSnapshot = await getDocs(movementsQuery);
        if (!movementSnapshot.empty) {
          const lastMovement = movementSnapshot.docs[0].data();
          productLastMovement.set(product.id!, lastMovement.createdAt);
        }
      }

      const now = new Date();
      const agingData = products
        .filter(product => (product.quantity || 0) > 0) // Only products with stock
        .map(product => {
          const lastMovementDate = productLastMovement.get(product.id!) || product.createdAt || product.updatedAt;
          const daysSinceLastMovement = Math.floor(
            (now.getTime() - new Date(lastMovementDate).getTime()) / (1000 * 60 * 60 * 24)
          );

          const agingCategory = this.getAgingCategory(daysSinceLastMovement);
          const riskLevel = this.getRiskLevel(daysSinceLastMovement);
          const recommendedAction = this.getRecommendedAction(daysSinceLastMovement, product);

          return {
            productId: product.id!,
            productName: product.name,
            currentQuantity: product.quantity || 0,
            unitCost: product.purchasePrice || product.price || 0,
            totalValue: (product.quantity || 0) * (product.purchasePrice || product.price || 0),
            lastMovementDate,
            daysSinceLastMovement,
            agingCategory,
            riskLevel,
            recommendedAction
          };
        });

      // Calculate summary
      const totalValue = agingData.reduce((sum, item) => sum + item.totalValue, 0);
      
      const byAgingCategory: Record<string, { count: number; value: number; percentage: number }> = {};
      ['0-30', '31-60', '61-90', '91-180', '180+'].forEach(category => {
        const items = agingData.filter(item => item.agingCategory === category);
        const value = items.reduce((sum, item) => sum + item.totalValue, 0);
        byAgingCategory[category] = {
          count: items.length,
          value,
          percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
        };
      });

      const riskAnalysis = {
        lowRisk: {
          count: agingData.filter(item => item.riskLevel === 'low').length,
          value: agingData.filter(item => item.riskLevel === 'low').reduce((sum, item) => sum + item.totalValue, 0)
        },
        mediumRisk: {
          count: agingData.filter(item => item.riskLevel === 'medium').length,
          value: agingData.filter(item => item.riskLevel === 'medium').reduce((sum, item) => sum + item.totalValue, 0)
        },
        highRisk: {
          count: agingData.filter(item => item.riskLevel === 'high').length,
          value: agingData.filter(item => item.riskLevel === 'high').reduce((sum, item) => sum + item.totalValue, 0)
        },
        criticalRisk: {
          count: agingData.filter(item => item.riskLevel === 'critical').length,
          value: agingData.filter(item => item.riskLevel === 'critical').reduce((sum, item) => sum + item.totalValue, 0)
        }
      };

      const recommendations = [
        `${riskAnalysis.criticalRisk.count} items require immediate attention (180+ days old)`,
        `Consider liquidation strategies for high-risk inventory worth ${this.formatCurrency(riskAnalysis.highRisk.value)}`,
        `Review demand patterns for medium-risk items to prevent further aging`,
        `Total aged inventory value: ${this.formatCurrency(riskAnalysis.highRisk.value + riskAnalysis.criticalRisk.value)}`
      ];

      return {
        products: agingData,
        summary: {
          totalValue,
          byAgingCategory,
          riskAnalysis,
          recommendations
        }
      };

    } catch (error) {
      console.error('Error generating aging report:', error);
      throw error;
    }
  }

  // Helper methods
  private static calculateRecommendedStockLevel(item: any, classification: 'A' | 'B' | 'C'): number {
    // Simplified calculation - in reality, this would consider lead times, demand variability, etc.
    const monthlyUsage = item.annualUsage / 12;
    
    switch (classification) {
      case 'A':
        return Math.ceil(monthlyUsage * 2); // 2 months stock for A items
      case 'B':
        return Math.ceil(monthlyUsage * 1.5); // 1.5 months stock for B items
      case 'C':
        return Math.ceil(monthlyUsage * 3); // 3 months stock for C items (bulk ordering)
      default:
        return Math.ceil(monthlyUsage * 2);
    }
  }

  private static determineStockStatus(currentStock: number, recommendedStock: number): 'optimal' | 'overstock' | 'understock' {
    const ratio = currentStock / recommendedStock;
    
    if (ratio < 0.8) return 'understock';
    if (ratio > 1.5) return 'overstock';
    return 'optimal';
  }

  private static getAgingCategory(days: number): '0-30' | '31-60' | '61-90' | '91-180' | '180+' {
    if (days <= 30) return '0-30';
    if (days <= 60) return '31-60';
    if (days <= 90) return '61-90';
    if (days <= 180) return '91-180';
    return '180+';
  }

  private static getRiskLevel(days: number): 'low' | 'medium' | 'high' | 'critical' {
    if (days <= 60) return 'low';
    if (days <= 90) return 'medium';
    if (days <= 180) return 'high';
    return 'critical';
  }

  private static getRecommendedAction(days: number, product: Product): string {
    if (days <= 30) return 'Monitor regularly';
    if (days <= 60) return 'Review demand patterns';
    if (days <= 90) return 'Consider promotional pricing';
    if (days <= 180) return 'Implement liquidation strategy';
    return 'Immediate action required - consider write-off';
  }

  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}