export function formatCurrency(amount: number, currency: string = 'INR', locale: string = 'en-IN'): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0.00';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatNumber(num: number, locale: string = 'en-IN'): string {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat(locale).format(num);
}

export function formatPercentage(num: number, decimals: number = 2): string {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0%';
  }

  return `${num.toFixed(decimals)}%`;
}

export function formatCompactNumber(num: number, locale: string = 'en-IN'): string {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(num);
}

export function roundToDecimal(num: number, decimals: number = 2): number {
  if (typeof num !== 'number' || isNaN(num)) {
    return 0;
  }

  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function parseNumber(str: string): number {
  if (typeof str !== 'string') {
    return 0;
  }

  // Remove currency symbols and commas
  const cleanStr = str.replace(/[₹$,\s]/g, '');
  const num = parseFloat(cleanStr);
  
  return isNaN(num) ? 0 : num;
}

export function formatFileSize(bytes: number): string {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function calculatePercentage(value: number, total: number): number {
  if (typeof value !== 'number' || typeof total !== 'number' || total === 0) {
    return 0;
  }

  return (value / total) * 100;
}

export function calculateGST(amount: number, gstRate: number, inclusive: boolean = false): {
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
} {
  if (typeof amount !== 'number' || typeof gstRate !== 'number' || isNaN(amount) || isNaN(gstRate)) {
    return { baseAmount: 0, gstAmount: 0, totalAmount: 0 };
  }

  let baseAmount: number;
  let gstAmount: number;
  let totalAmount: number;

  if (inclusive) {
    // Amount includes GST
    totalAmount = amount;
    baseAmount = amount / (1 + gstRate / 100);
    gstAmount = amount - baseAmount;
  } else {
    // Amount excludes GST
    baseAmount = amount;
    gstAmount = amount * (gstRate / 100);
    totalAmount = amount + gstAmount;
  }

  return {
    baseAmount: roundToDecimal(baseAmount),
    gstAmount: roundToDecimal(gstAmount),
    totalAmount: roundToDecimal(totalAmount)
  };
}

export function calculateDiscount(originalPrice: number, discountPercent: number): {
  discountAmount: number;
  finalPrice: number;
} {
  if (typeof originalPrice !== 'number' || typeof discountPercent !== 'number' || 
      isNaN(originalPrice) || isNaN(discountPercent)) {
    return { discountAmount: 0, finalPrice: originalPrice || 0 };
  }

  const discountAmount = (originalPrice * discountPercent) / 100;
  const finalPrice = originalPrice - discountAmount;

  return {
    discountAmount: roundToDecimal(discountAmount),
    finalPrice: roundToDecimal(finalPrice)
  };
}

export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function clamp(value: number, min: number, max: number): number {
  if (!isValidNumber(value) || !isValidNumber(min) || !isValidNumber(max)) {
    return 0;
  }

  return Math.min(Math.max(value, min), max);
}

export function generateRandomNumber(min: number = 0, max: number = 100): number {
  if (!isValidNumber(min) || !isValidNumber(max) || min >= max) {
    return 0;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function sum(numbers: number[]): number {
  if (!Array.isArray(numbers)) {
    return 0;
  }

  return numbers.reduce((total, num) => {
    return total + (isValidNumber(num) ? num : 0);
  }, 0);
}

export function average(numbers: number[]): number {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return 0;
  }

  const validNumbers = numbers.filter(isValidNumber);
  if (validNumbers.length === 0) {
    return 0;
  }

  return sum(validNumbers) / validNumbers.length;
}

export function median(numbers: number[]): number {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return 0;
  }

  const validNumbers = numbers.filter(isValidNumber).sort((a, b) => a - b);
  if (validNumbers.length === 0) {
    return 0;
  }

  const middle = Math.floor(validNumbers.length / 2);

  if (validNumbers.length % 2 === 0) {
    return (validNumbers[middle - 1] + validNumbers[middle]) / 2;
  } else {
    return validNumbers[middle];
  }
}

export function formatIndianCurrency(amount: number): string {
  if (!isValidNumber(amount)) {
    return '₹0.00';
  }

  // Convert to Indian numbering system (lakhs, crores)
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return formatter.format(amount);
}

export function formatDate(dateString: string | Date, locale: string = 'en-IN'): string {
  if (!dateString) {
    return '';
  }

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(locale, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function formatDateTime(dateString: string | Date, locale: string = 'en-IN'): string {
  if (!dateString) {
    return '';
  }

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString(locale, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateShort(dateString: string | Date): string {
  if (!dateString) {
    return '';
  }

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-GB', { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}