import { useState, useCallback } from 'react';
import OptimizedInvoiceService, { 
  OptimizedInvoiceOptions, 
  InvoiceCreationResult 
} from '@/services/optimizedInvoiceService';
import { Invoice } from '@/types/invoice';

export interface UseOptimizedInvoiceReturn {
  // State
  loading: boolean;
  result: InvoiceCreationResult | null;
  executionTime: number | null;
  
  // Actions
  createQuickInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<InvoiceCreationResult>;
  createSafeInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<InvoiceCreationResult>;
  createCustomInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>, options: Partial<OptimizedInvoiceOptions>) => Promise<InvoiceCreationResult>;
  clearResult: () => void;
  
  // Utilities
  getPerformanceMetrics: () => {
    averageTime: number;
    successRate: number;
    totalInvoices: number;
  };
}

// Performance tracking
interface PerformanceMetric {
  timestamp: number;
  executionTime: number;
  success: boolean;
  mode: 'quick' | 'safe' | 'custom';
}

let performanceMetrics: PerformanceMetric[] = [];

export const useOptimizedInvoice = (): UseOptimizedInvoiceReturn => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvoiceCreationResult | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Track performance
  const trackPerformance = (metric: PerformanceMetric) => {
    performanceMetrics.push(metric);
    
    // Keep only last 100 metrics
    if (performanceMetrics.length > 100) {
      performanceMetrics = performanceMetrics.slice(-100);
    }
  };

  // Create quick invoice
  const createQuickInvoice = useCallback(async (
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<InvoiceCreationResult> => {
    setLoading(true);
    setResult(null);
    
    const startTime = Date.now();
    
    try {
      const invoiceResult = await OptimizedInvoiceService.createQuickInvoice(invoiceData);
      const endTime = Date.now();
      const execTime = endTime - startTime;
      
      setResult(invoiceResult);
      setExecutionTime(execTime);
      
      // Track performance
      trackPerformance({
        timestamp: startTime,
        executionTime: execTime,
        success: invoiceResult.success,
        mode: 'quick'
      });
      
      return invoiceResult;
    } catch (error) {
      const errorResult: InvoiceCreationResult = {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
      
      setResult(errorResult);
      
      // Track failed performance
      trackPerformance({
        timestamp: startTime,
        executionTime: Date.now() - startTime,
        success: false,
        mode: 'quick'
      });
      
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create safe invoice
  const createSafeInvoice = useCallback(async (
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<InvoiceCreationResult> => {
    setLoading(true);
    setResult(null);
    
    const startTime = Date.now();
    
    try {
      const invoiceResult = await OptimizedInvoiceService.createSafeInvoice(invoiceData);
      const endTime = Date.now();
      const execTime = endTime - startTime;
      
      setResult(invoiceResult);
      setExecutionTime(execTime);
      
      // Track performance
      trackPerformance({
        timestamp: startTime,
        executionTime: execTime,
        success: invoiceResult.success,
        mode: 'safe'
      });
      
      return invoiceResult;
    } catch (error) {
      const errorResult: InvoiceCreationResult = {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
      
      setResult(errorResult);
      
      // Track failed performance
      trackPerformance({
        timestamp: startTime,
        executionTime: Date.now() - startTime,
        success: false,
        mode: 'safe'
      });
      
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create custom invoice
  const createCustomInvoice = useCallback(async (
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>,
    options: Partial<OptimizedInvoiceOptions>
  ): Promise<InvoiceCreationResult> => {
    setLoading(true);
    setResult(null);
    
    const startTime = Date.now();
    
    try {
      const invoiceResult = await OptimizedInvoiceService.createOptimizedInvoice(invoiceData, options);
      const endTime = Date.now();
      const execTime = endTime - startTime;
      
      setResult(invoiceResult);
      setExecutionTime(execTime);
      
      // Track performance
      trackPerformance({
        timestamp: startTime,
        executionTime: execTime,
        success: invoiceResult.success,
        mode: 'custom'
      });
      
      return invoiceResult;
    } catch (error) {
      const errorResult: InvoiceCreationResult = {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
      
      setResult(errorResult);
      
      // Track failed performance
      trackPerformance({
        timestamp: startTime,
        executionTime: Date.now() - startTime,
        success: false,
        mode: 'custom'
      });
      
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear result
  const clearResult = useCallback(() => {
    setResult(null);
    setExecutionTime(null);
  }, []);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    if (performanceMetrics.length === 0) {
      return {
        averageTime: 0,
        successRate: 0,
        totalInvoices: 0
      };
    }

    const totalTime = performanceMetrics.reduce((sum, metric) => sum + metric.executionTime, 0);
    const successfulInvoices = performanceMetrics.filter(metric => metric.success).length;

    return {
      averageTime: Math.round(totalTime / performanceMetrics.length),
      successRate: Math.round((successfulInvoices / performanceMetrics.length) * 100),
      totalInvoices: performanceMetrics.length
    };
  }, []);

  return {
    // State
    loading,
    result,
    executionTime,
    
    // Actions
    createQuickInvoice,
    createSafeInvoice,
    createCustomInvoice,
    clearResult,
    
    // Utilities
    getPerformanceMetrics
  };
};

// Export performance utilities for dashboard usage
export const getGlobalPerformanceMetrics = () => {
  if (performanceMetrics.length === 0) {
    return {
      averageTime: 0,
      successRate: 0,
      totalInvoices: 0,
      modeBreakdown: {
        quick: { count: 0, avgTime: 0, successRate: 0 },
        safe: { count: 0, avgTime: 0, successRate: 0 },
        custom: { count: 0, avgTime: 0, successRate: 0 }
      }
    };
  }

  const totalTime = performanceMetrics.reduce((sum, metric) => sum + metric.executionTime, 0);
  const successfulInvoices = performanceMetrics.filter(metric => metric.success).length;

  // Mode breakdown
  const modeBreakdown = {
    quick: performanceMetrics.filter(m => m.mode === 'quick'),
    safe: performanceMetrics.filter(m => m.mode === 'safe'),
    custom: performanceMetrics.filter(m => m.mode === 'custom')
  };

  const getModeStats = (metrics: PerformanceMetric[]) => {
    if (metrics.length === 0) return { count: 0, avgTime: 0, successRate: 0 };
    
    const avgTime = metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length;
    const successRate = (metrics.filter(m => m.success).length / metrics.length) * 100;
    
    return {
      count: metrics.length,
      avgTime: Math.round(avgTime),
      successRate: Math.round(successRate)
    };
  };

  return {
    averageTime: Math.round(totalTime / performanceMetrics.length),
    successRate: Math.round((successfulInvoices / performanceMetrics.length) * 100),
    totalInvoices: performanceMetrics.length,
    modeBreakdown: {
      quick: getModeStats(modeBreakdown.quick),
      safe: getModeStats(modeBreakdown.safe),
      custom: getModeStats(modeBreakdown.custom)
    }
  };
};

export default useOptimizedInvoice;