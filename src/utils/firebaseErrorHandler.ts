/**
 * Firebase Error Handler Utility
 * Provides better error handling and user-friendly messages for Firebase operations
 */

import { FirebaseError } from 'firebase/app';

export interface FirebaseErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Maps Firebase error codes to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, Omit<FirebaseErrorInfo, 'code'>> = {
  // Firestore errors
  'failed-precondition': {
    message: 'Multiple tabs detected - persistence disabled',
    userMessage: 'Multiple browser tabs are open. The app will work normally but offline features may be limited.',
    severity: 'warning'
  },
  'permission-denied': {
    message: 'Permission denied',
    userMessage: 'You do not have permission to perform this action.',
    severity: 'error'
  },
  'unavailable': {
    message: 'Service unavailable',
    userMessage: 'The service is temporarily unavailable. Please try again later.',
    severity: 'error'
  },
  'deadline-exceeded': {
    message: 'Request timeout',
    userMessage: 'The request took too long. Please check your connection and try again.',
    severity: 'error'
  },
  'not-found': {
    message: 'Document not found',
    userMessage: 'The requested data could not be found.',
    severity: 'error'
  },
  'already-exists': {
    message: 'Document already exists',
    userMessage: 'This item already exists.',
    severity: 'warning'
  },
  'resource-exhausted': {
    message: 'Quota exceeded',
    userMessage: 'Service quota exceeded. Please try again later.',
    severity: 'error'
  },
  'cancelled': {
    message: 'Operation cancelled',
    userMessage: 'The operation was cancelled.',
    severity: 'info'
  },
  'data-loss': {
    message: 'Data loss detected',
    userMessage: 'Some data may have been lost. Please refresh and try again.',
    severity: 'error'
  },
  'unknown': {
    message: 'Unknown error',
    userMessage: 'An unexpected error occurred. Please try again.',
    severity: 'error'
  },
  'invalid-argument': {
    message: 'Invalid argument',
    userMessage: 'Invalid data provided. Please check your input.',
    severity: 'error'
  },
  'out-of-range': {
    message: 'Value out of range',
    userMessage: 'The provided value is out of acceptable range.',
    severity: 'error'
  },
  'unauthenticated': {
    message: 'User not authenticated',
    userMessage: 'Please sign in to continue.',
    severity: 'error'
  },
  'internal': {
    message: 'Internal server error',
    userMessage: 'An internal error occurred. Please try again later.',
    severity: 'error'
  },
  'unimplemented': {
    message: 'Feature not implemented',
    userMessage: 'This feature is not available in your browser.',
    severity: 'warning'
  },
  'aborted': {
    message: 'Operation aborted',
    userMessage: 'The operation was aborted due to a conflict.',
    severity: 'warning'
  },

  // Auth errors
  'auth/user-not-found': {
    message: 'User not found',
    userMessage: 'No account found with this email address.',
    severity: 'error'
  },
  'auth/wrong-password': {
    message: 'Wrong password',
    userMessage: 'Incorrect password. Please try again.',
    severity: 'error'
  },
  'auth/email-already-in-use': {
    message: 'Email already in use',
    userMessage: 'An account with this email already exists.',
    severity: 'error'
  },
  'auth/weak-password': {
    message: 'Weak password',
    userMessage: 'Password should be at least 6 characters long.',
    severity: 'error'
  },
  'auth/invalid-email': {
    message: 'Invalid email',
    userMessage: 'Please enter a valid email address.',
    severity: 'error'
  },
  'auth/user-disabled': {
    message: 'User account disabled',
    userMessage: 'This account has been disabled. Please contact support.',
    severity: 'error'
  },
  'auth/too-many-requests': {
    message: 'Too many requests',
    userMessage: 'Too many failed attempts. Please try again later.',
    severity: 'error'
  },
  'auth/network-request-failed': {
    message: 'Network error',
    userMessage: 'Network error. Please check your connection.',
    severity: 'error'
  }
};

/**
 * Handles Firebase errors and returns user-friendly error information
 */
export function handleFirebaseError(error: any): FirebaseErrorInfo {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log the full error in development
  if (isDevelopment) {
    console.error('Firebase Error:', error);
  }

  // Handle FirebaseError instances
  if (error instanceof FirebaseError || (error && error.code)) {
    const errorCode = error.code;
    const errorInfo = ERROR_MESSAGES[errorCode];
    
    if (errorInfo) {
      return {
        code: errorCode,
        ...errorInfo
      };
    }
  }

  // Handle generic errors
  const message = error?.message || 'An unexpected error occurred';
  
  return {
    code: 'unknown',
    message,
    userMessage: 'An unexpected error occurred. Please try again.',
    severity: 'error'
  };
}

/**
 * Checks if an error is a Firebase persistence error that can be safely ignored
 */
export function isPersistenceError(error: any): boolean {
  return error?.code === 'failed-precondition' || 
         error?.code === 'unimplemented' ||
         error?.message?.includes('persistence');
}

/**
 * Logs Firebase errors appropriately based on environment and error type
 */
export function logFirebaseError(error: any, context?: string): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorInfo = handleFirebaseError(error);
  
  // Don't spam console with persistence errors in development
  if (isDevelopment && isPersistenceError(error)) {
    return;
  }
  
  const prefix = context ? `[${context}]` : '[Firebase]';
  
  switch (errorInfo.severity) {
    case 'error':
      console.error(`${prefix} Error:`, errorInfo.message);
      break;
    case 'warning':
      console.warn(`${prefix} Warning:`, errorInfo.message);
      break;
    case 'info':
      console.info(`${prefix} Info:`, errorInfo.message);
      break;
  }
}

/**
 * Creates a user-friendly error message for display in UI
 */
export function getErrorMessage(error: any): string {
  const errorInfo = handleFirebaseError(error);
  return errorInfo.userMessage;
}

/**
 * Determines if an error should be shown to the user
 */
export function shouldShowError(error: any): boolean {
  // Don't show persistence errors to users as they don't affect functionality
  if (isPersistenceError(error)) {
    return false;
  }
  
  const errorInfo = handleFirebaseError(error);
  return errorInfo.severity === 'error';
}