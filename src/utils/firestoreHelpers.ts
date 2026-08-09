/**
 * Firestore helper utilities
 */

/**
 * Execute a function with retry logic
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain types of errors
      if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

/**
 * Batch operations helper
 */
export function createBatches<T>(items: T[], batchSize: number = 500): T[][] {
  const batches: T[][] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  return batches;
}

/**
 * Safe document ID generator
 */
export function generateSafeDocumentId(prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}
/**
 * Get user-friendly error message from Firestore error
 */
export function getFirestoreErrorMessage(error: any): string {
  if (!error) return "An unknown error occurred";
  
  // Handle Firebase/Firestore specific errors
  if (error.code) {
    switch (error.code) {
      case "permission-denied":
        return "You do not have permission to perform this action";
      case "unauthenticated":
        return "Please sign in to continue";
      case "not-found":
        return "The requested document was not found";
      case "already-exists":
        return "A document with this ID already exists";
      case "resource-exhausted":
        return "Too many requests. Please try again later";
      case "failed-precondition":
        return "The operation failed due to a precondition";
      case "aborted":
        return "The operation was aborted due to a conflict";
      case "out-of-range":
        return "The operation was attempted past the valid range";
      case "unimplemented":
        return "This operation is not implemented or supported";
      case "internal":
        return "An internal error occurred. Please try again";
      case "unavailable":
        return "The service is currently unavailable. Please try again";
      case "data-loss":
        return "Unrecoverable data loss or corruption";
      case "deadline-exceeded":
        return "The operation took too long to complete";
      case "cancelled":
        return "The operation was cancelled";
      case "invalid-argument":
        return "Invalid data provided";
      default:
        return error.message || "An error occurred while processing your request";
    }
  }
  
  // Handle network errors
  if (error.message) {
    if (error.message.includes("network")) {
      return "Network error. Please check your connection and try again";
    }
    if (error.message.includes("timeout")) {
      return "Request timed out. Please try again";
    }
    return error.message;
  }
  
  // Fallback for other error types
  return "An unexpected error occurred. Please try again";
}
