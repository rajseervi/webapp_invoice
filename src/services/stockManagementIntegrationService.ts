import { db } from '@/firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  writeBatch, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';

// Import all the services
import { EnhancedStockAlertsService } from './enhancedStockAlertsService';
import { EnhancedInventoryTrackingService } from './enhancedInventoryTrackingService';
import { StockReorderService } from './stockReorderService';
import { InventoryReportsService } from './inventoryReportsService';
import { StockManagementService } from './stockManagementService';

export interface StockManagementDashboard {
  summary: {
    totalProducts: number;
    totalStockValue: number;
    lowStockItems: number;
    criticalAlerts: number;
    pendingReorders: number;
    recentMovements: number;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recentActivity: Array<{
    type: 'movement' | 'alert' | 'reorder' | 'adjustment';
    description: string;
    timestamp: string;
    severity?: 'info' | 'warning' | 'error' | 'success';
  }>;
  quickActions: Array<{
    id: string;
    title: string;
    description: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
    count?: number;
  }>;
  trends: {
    stockValue: Array<{ date: string; value: number }>;
    movements: Array<{ date: string; inbound: number; outbound: number }>;
    alerts: Array<{ date: string; count: number }>;
  };
}

export interface AutomationRule {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
  triggerType: 'stock_level' | 'movement' | 'time_based' | 'alert_generated';
  conditions: {
    productIds?: string[];
    categories?: string[];
    stockLevel?: { operator: '<' | '>' | '='; value: number };
    alertSeverity?: string[];
    timeSchedule?: { frequency: 'daily' | 'weekly' | 'monthly'; time: string };
  };
  actions: Array<{
    type: 'generate_alert' | 'create_reorder' | 'send_notification' | 'update_stock' | 'generate_report';
    parameters: Record<string, any>;
  }>;
  lastExecuted?: string;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface StockManagementSettings {
  id?: string;
  autoAlertGeneration: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    severityThresholds: {
      critical: number; // percentage below reorder point
      high: number;
      medium: number;
      low: number;
    };
  };
  autoReorderSuggestions: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    autoApprove: boolean;
    approvalThreshold: number; // auto-approve orders below this value
  };
  notifications: {
    email: {
      enabled: boolean;
      recipients: string[];
      alertTypes: string[];
    };
    inApp: {
      enabled: boolean;
      alertTypes: string[];
    };
  };
  reporting: {
    autoGenerate: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    reportTypes: string[];
    recipients: string[];
  };
  stockLevelDefaults: {
    reorderPointPercentage: number; // percentage of max stock
    maxStockMultiplier: number; // multiplier of average monthly usage
    leadTimeDays: number;
  };
  updatedAt: string;
  updatedBy?: string;
}

export class StockManagementIntegrationService {
  private static readonly AUTOMATION_RULES_COLLECTION = 'automation_rules';
  private static readonly SETTINGS_COLLECTION = 'stock_management_settings';
  private static readonly ACTIVITY_LOG_COLLECTION = 'stock_activity_log';

  /**
   * Get comprehensive stock management dashboard data
   */
  static async getDashboardData(): Promise<StockManagementDashboard> {
    try {
      // Get basic inventory data
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Get alerts summary
      const alertsSummary = await EnhancedStockAlertsService.getAlertSummary();
      
      // Get recent movements
      const recentMovementsQuery = query(
        collection(db, 'enhanced_stock_movements'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const recentMovementsSnapshot = await getDocs(recentMovementsQuery);
      const recentMovements = recentMovementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get pending reorder suggestions
      const pendingReordersQuery = query(
        collection(db, 'reorder_suggestions'),
        where('status', '==', 'pending')
      );
      const pendingReordersSnapshot = await getDocs(pendingReordersQuery);

      // Calculate summary
      const totalProducts = products.length;
      const totalStockValue = products.reduce((sum, p: any) => sum + (p.quantity || 0) * (p.price || 0), 0);
      const lowStockItems = products.filter((p: any) => (p.quantity || 0) <= (p.reorderPoint || 10)).length;
      
      // Build recent activity
      const recentActivity = [
        ...recentMovements.slice(0, 5).map((movement: any) => ({
          type: 'movement' as const,
          description: `${movement.movementType.toUpperCase()}: ${movement.quantity} units of ${movement.productName}`,
          timestamp: movement.createdAt,
          severity: movement.movementType === 'out' ? 'warning' as const : 'info' as const
        })),
        // Add alert activities if available
        ...(alertsSummary.recentAlerts || []).slice(0, 3).map((alert: any) => ({
          type: 'alert' as const,
          description: `${alert.severity.toUpperCase()} alert: ${alert.message}`,
          timestamp: alert.createdAt,
          severity: alert.severity === 'critical' ? 'error' as const : 'warning' as const
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      // Generate quick actions
      const quickActions = [
        {
          id: 'generate_alerts',
          title: 'Generate Stock Alerts',
          description: 'Check for low stock and generate alerts',
          action: 'generate_alerts',
          priority: 'high' as const,
          count: lowStockItems
        },
        {
          id: 'review_reorders',
          title: 'Review Reorder Suggestions',
          description: 'Review and approve pending reorder suggestions',
          action: 'review_reorders',
          priority: 'medium' as const,
          count: pendingReordersSnapshot.docs.length
        },
        {
          id: 'cycle_count',
          title: 'Perform Cycle Count',
          description: 'Conduct physical inventory count',
          action: 'cycle_count',
          priority: 'low' as const
        },
        {
          id: 'generate_reports',
          title: 'Generate Reports',
          description: 'Create inventory analysis reports',
          action: 'generate_reports',
          priority: 'low' as const
        }
      ];

      // Generate trends (simplified - in production, this would use historical data)
      const trends = {
        stockValue: this.generateMockTrendData('value', 30),
        movements: this.generateMockMovementTrends(30),
        alerts: this.generateMockTrendData('alerts', 30)
      };

      return {
        summary: {
          totalProducts,
          totalStockValue,
          lowStockItems,
          criticalAlerts: alertsSummary.criticalAlerts,
          pendingReorders: pendingReordersSnapshot.docs.length,
          recentMovements: recentMovements.length
        },
        alerts: {
          critical: alertsSummary.alertsBySeverity.critical || 0,
          high: alertsSummary.alertsBySeverity.high || 0,
          medium: alertsSummary.alertsBySeverity.medium || 0,
          low: alertsSummary.alertsBySeverity.low || 0
        },
        recentActivity,
        quickActions,
        trends
      };

    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Execute automated stock management tasks
   */
  static async executeAutomatedTasks(userId?: string): Promise<{
    alertsGenerated: number;
    reordersCreated: number;
    reportsGenerated: number;
    errors: string[];
  }> {
    const results = {
      alertsGenerated: 0,
      reordersCreated: 0,
      reportsGenerated: 0,
      errors: [] as string[]
    };

    try {
      // Generate automatic alerts
      const alertResult = await EnhancedStockAlertsService.generateAutomaticAlerts(userId);
      results.alertsGenerated = alertResult.generated;

      // Generate reorder suggestions
      const reorderSuggestions = await StockReorderService.generateReorderSuggestions(userId);
      results.reordersCreated = reorderSuggestions.length;

      // Log activity
      await this.logActivity({
        type: 'automation',
        description: `Automated tasks executed: ${results.alertsGenerated} alerts, ${results.reordersCreated} reorders`,
        timestamp: new Date().toISOString(),
        userId
      });

    } catch (error) {
      console.error('Error executing automated tasks:', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return results;
  }

  /**
   * Create automation rule
   */
  static async createAutomationRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): Promise<string | null> {
    try {
      const now = new Date().toISOString();
      
      const docRef = await addDoc(collection(db, this.AUTOMATION_RULES_COLLECTION), {
        ...rule,
        executionCount: 0,
        createdAt: now,
        updatedAt: now
      });

      return docRef.id;

    } catch (error) {
      console.error('Error creating automation rule:', error);
      return null;
    }
  }

  /**
   * Get automation rules
   */
  static async getAutomationRules(): Promise<AutomationRule[]> {
    try {
      const snapshot = await getDocs(collection(db, this.AUTOMATION_RULES_COLLECTION));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AutomationRule[];

    } catch (error) {
      console.error('Error getting automation rules:', error);
      return [];
    }
  }

  /**
   * Update stock management settings
   */
  static async updateSettings(settings: Omit<StockManagementSettings, 'id' | 'updatedAt'>, userId?: string): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      
      // Check if settings document exists
      const settingsQuery = query(collection(db, this.SETTINGS_COLLECTION), limit(1));
      const settingsSnapshot = await getDocs(settingsQuery);
      
      const settingsData = {
        ...settings,
        updatedAt: now,
        updatedBy: userId
      };

      if (settingsSnapshot.empty) {
        // Create new settings document
        await addDoc(collection(db, this.SETTINGS_COLLECTION), settingsData);
      } else {
        // Update existing settings
        const settingsDoc = settingsSnapshot.docs[0];
        await updateDoc(settingsDoc.ref, settingsData);
      }

      return true;

    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }

  /**
   * Get stock management settings
   */
  static async getSettings(): Promise<StockManagementSettings | null> {
    try {
      const settingsQuery = query(collection(db, this.SETTINGS_COLLECTION), limit(1));
      const settingsSnapshot = await getDocs(settingsQuery);
      
      if (settingsSnapshot.empty) {
        // Return default settings
        return this.getDefaultSettings();
      }

      const settingsDoc = settingsSnapshot.docs[0];
      return {
        id: settingsDoc.id,
        ...settingsDoc.data()
      } as StockManagementSettings;

    } catch (error) {
      console.error('Error getting settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Perform comprehensive stock analysis
   */
  static async performStockAnalysis(): Promise<{
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    healthScore: number;
    insights: string[];
    recommendations: string[];
    metrics: {
      stockTurnover: number;
      fillRate: number;
      stockoutRate: number;
      excessInventoryRate: number;
    };
  }> {
    try {
      // Get various reports and data
      const [valuationReport, movementReport, abcReport, agingReport] = await Promise.all([
        InventoryReportsService.generateStockValuationReport(),
        InventoryReportsService.generateMovementSummaryReport({
          dateRange: {
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          }
        }),
        InventoryReportsService.generateABCAnalysisReport(),
        InventoryReportsService.generateAgingReport()
      ]);

      // Calculate metrics
      const totalValue = valuationReport.summary.totalValue;
      const totalMovements = movementReport.summary.totalMovements;
      const agingValue = agingReport.summary.totalValue;
      const criticalAgingValue = agingReport.summary.riskAnalysis.criticalRisk.value;

      const stockTurnover = totalValue > 0 ? (totalMovements * 100) / totalValue : 0;
      const fillRate = 95; // Simplified - would calculate from actual stockouts
      const stockoutRate = 5; // Simplified
      const excessInventoryRate = agingValue > 0 ? (criticalAgingValue / agingValue) * 100 : 0;

      // Calculate health score
      let healthScore = 0;
      healthScore += Math.min(stockTurnover / 10, 25); // Max 25 points for turnover
      healthScore += Math.min(fillRate, 25); // Max 25 points for fill rate
      healthScore += Math.max(25 - stockoutRate, 0); // Max 25 points for low stockout rate
      healthScore += Math.max(25 - excessInventoryRate, 0); // Max 25 points for low excess inventory

      // Determine overall health
      let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
      if (healthScore >= 85) overallHealth = 'excellent';
      else if (healthScore >= 70) overallHealth = 'good';
      else if (healthScore >= 50) overallHealth = 'fair';
      else overallHealth = 'poor';

      // Generate insights
      const insights = [
        `Stock turnover rate: ${stockTurnover.toFixed(1)}%`,
        `Fill rate: ${fillRate.toFixed(1)}%`,
        `Excess inventory: ${excessInventoryRate.toFixed(1)}% of total value`,
        `Class A items represent ${abcReport.summary.classA.valuePercentage.toFixed(1)}% of inventory value`
      ];

      // Generate recommendations
      const recommendations = [];
      if (stockTurnover < 5) recommendations.push('Consider reducing slow-moving inventory');
      if (fillRate < 95) recommendations.push('Improve stock availability to reduce stockouts');
      if (excessInventoryRate > 20) recommendations.push('Implement aging inventory liquidation strategy');
      if (abcReport.summary.classA.count > abcReport.products.length * 0.3) {
        recommendations.push('Review ABC classification - too many Class A items');
      }

      return {
        overallHealth,
        healthScore,
        insights,
        recommendations,
        metrics: {
          stockTurnover,
          fillRate,
          stockoutRate,
          excessInventoryRate
        }
      };

    } catch (error) {
      console.error('Error performing stock analysis:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time stock management updates
   */
  static subscribeToUpdates(callback: (data: any) => void): Unsubscribe {
    // Subscribe to alerts
    const alertsUnsubscribe = onSnapshot(
      query(collection(db, 'enhanced_stock_alerts'), orderBy('createdAt', 'desc'), limit(5)),
      (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback({ type: 'alerts', data: alerts });
      }
    );

    // Subscribe to movements
    const movementsUnsubscribe = onSnapshot(
      query(collection(db, 'enhanced_stock_movements'), orderBy('createdAt', 'desc'), limit(5)),
      (snapshot) => {
        const movements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback({ type: 'movements', data: movements });
      }
    );

    // Return combined unsubscribe function
    return () => {
      alertsUnsubscribe();
      movementsUnsubscribe();
    };
  }

  // Private helper methods

  private static async logActivity(activity: {
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await addDoc(collection(db, this.ACTIVITY_LOG_COLLECTION), activity);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  private static getDefaultSettings(): StockManagementSettings {
    return {
      autoAlertGeneration: {
        enabled: true,
        frequency: 'daily',
        severityThresholds: {
          critical: 0,
          high: 10,
          medium: 25,
          low: 50
        }
      },
      autoReorderSuggestions: {
        enabled: true,
        frequency: 'weekly',
        autoApprove: false,
        approvalThreshold: 10000
      },
      notifications: {
        email: {
          enabled: false,
          recipients: [],
          alertTypes: ['critical', 'high']
        },
        inApp: {
          enabled: true,
          alertTypes: ['critical', 'high', 'medium']
        }
      },
      reporting: {
        autoGenerate: false,
        frequency: 'weekly',
        reportTypes: ['stock_valuation', 'movement_summary'],
        recipients: []
      },
      stockLevelDefaults: {
        reorderPointPercentage: 20,
        maxStockMultiplier: 3,
        leadTimeDays: 7
      },
      updatedAt: new Date().toISOString()
    };
  }

  private static generateMockTrendData(type: string, days: number): Array<{ date: string; value: number }> {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const value = type === 'alerts' 
        ? Math.floor(Math.random() * 10) 
        : Math.floor(Math.random() * 100000) + 50000;
      
      data.push({
        date: date.toISOString().split('T')[0],
        value
      });
    }
    
    return data;
  }

  private static generateMockMovementTrends(days: number): Array<{ date: string; inbound: number; outbound: number }> {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      data.push({
        date: date.toISOString().split('T')[0],
        inbound: Math.floor(Math.random() * 100) + 20,
        outbound: Math.floor(Math.random() * 80) + 30
      });
    }
    
    return data;
  }
}