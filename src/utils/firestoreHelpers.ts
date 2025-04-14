/**
 * Utility functions for handling Firestore operations with better error handling
 */

/**
 * Executes a Firestore operation with retry logic for connectivity issues
 * 
 * @param operation - The Firestore operation to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param onRetry - Optional callback function called on each retry attempt
 * @returns The result of the operation
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  onRetry?: (attempt: number, maxRetries: number, error: Error) => void
): Promise<T> {
  let retryCount = 0;
  
  const execute = async (): Promise<T> => {
    try {
      return await operation();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Check if it's a connectivity error
      const isConnectivityError = 
        error.message.includes('Could not reach Cloud Firestore backend') ||
        error.message.includes('network error') ||
        error.message.includes('offline') ||
        error.message.includes('failed to fetch');
      
      if (isConnectivityError && retryCount < maxRetries) {
        retryCount++;
        
        // Call the onRetry callback if provided
        if (onRetry) {
          onRetry(retryCount, maxRetries, error);
        }
        
        // Exponential backoff: wait longer between each retry
        const backoffTime = 2000 * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        // Retry the operation
        return execute();
      }
      
      // If it's not a connectivity error or we've exceeded max retries, throw the error
      throw error;
    }
  };
  
  return execute();
}

/**
 * Checks if an error is related to Firestore connectivity
 * 
 * @param error - The error to check
 * @returns True if it's a connectivity error, false otherwise
 */
export function isFirestoreConnectivityError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  return (
    error.message.includes('Could not reach Cloud Firestore backend') ||
    error.message.includes('network error') ||
    error.message.includes('offline') ||
    error.message.includes('failed to fetch')
  );
}

/**
 * Gets a user-friendly error message for Firestore errors
 * 
 * @param error - The error to process
 * @returns A user-friendly error message
 */
export function getFirestoreErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unknown error occurred';
  }
  
  if (isFirestoreConnectivityError(error)) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  if (error.message.includes('permission-denied')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.message.includes('not-found')) {
    return 'The requested document was not found.';
  }
  
  if (error.message.includes('already-exists')) {
    return 'This document already exists.';
  }
  
  return error.message || 'An error occurred while communicating with the database.';
}