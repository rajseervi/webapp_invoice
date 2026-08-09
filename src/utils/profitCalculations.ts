/**
 * Utility functions for profit and margin calculations
 */

export interface ProfitCalculation {
  profitAmount: number;
  profitPercentage: number;
  marginPercentage: number;
}

/**
 * Calculate profit metrics based on purchase and sale prices
 * @param purchasePrice - Cost price at which product is bought
 * @param salePrice - Price at which product is sold
 * @returns Object containing profit amount, profit percentage, and margin percentage
 */
export function calculateProfit(purchasePrice: number, salePrice: number): ProfitCalculation {
  const profitAmount = salePrice - purchasePrice;
  
  // Profit percentage = (Profit / Cost Price) × 100
  const profitPercentage = purchasePrice > 0 ? (profitAmount / purchasePrice) * 100 : 0;
  
  // Margin percentage = (Profit / Sale Price) × 100
  const marginPercentage = salePrice > 0 ? (profitAmount / salePrice) * 100 : 0;
  
  return {
    profitAmount: Number(profitAmount.toFixed(2)),
    profitPercentage: Number(profitPercentage.toFixed(2)),
    marginPercentage: Number(marginPercentage.toFixed(2))
  };
}

/**
 * Calculate sale price based on purchase price and desired profit percentage
 * @param purchasePrice - Cost price
 * @param profitPercentage - Desired profit percentage
 * @returns Calculated sale price
 */
export function calculateSalePriceFromProfitPercentage(
  purchasePrice: number, 
  profitPercentage: number
): number {
  const profitAmount = (purchasePrice * profitPercentage) / 100;
  return Number((purchasePrice + profitAmount).toFixed(2));
}

/**
 * Calculate sale price based on purchase price and desired margin percentage
 * @param purchasePrice - Cost price
 * @param marginPercentage - Desired margin percentage
 * @returns Calculated sale price
 */
export function calculateSalePriceFromMarginPercentage(
  purchasePrice: number, 
  marginPercentage: number
): number {
  // Sale Price = Cost Price / (1 - Margin%)
  const salePrice = purchasePrice / (1 - marginPercentage / 100);
  return Number(salePrice.toFixed(2));
}

/**
 * Format currency value for display
 * @param amount - Amount to format
 * @param currency - Currency symbol (default: ₹)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format percentage for display
 * @param percentage - Percentage to format
 * @returns Formatted percentage string
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

/**
 * Get profit status based on profit percentage
 * @param profitPercentage - Profit percentage
 * @returns Status object with color and label
 */
export function getProfitStatus(profitPercentage: number): {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'loss';
  color: 'success' | 'info' | 'warning' | 'error';
  label: string;
} {
  if (profitPercentage < 0) {
    return { status: 'loss', color: 'error', label: 'Loss' };
  } else if (profitPercentage < 10) {
    return { status: 'poor', color: 'error', label: 'Low Profit' };
  } else if (profitPercentage < 20) {
    return { status: 'fair', color: 'warning', label: 'Fair Profit' };
  } else if (profitPercentage < 30) {
    return { status: 'good', color: 'info', label: 'Good Profit' };
  } else {
    return { status: 'excellent', color: 'success', label: 'Excellent Profit' };
  }
}