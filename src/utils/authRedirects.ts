import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context';

/**
 * Redirects the user based on their role and authentication status
 * 
 * @param router - Next.js router instance
 * @param role - User role (admin, manager, staff, user)
 * @param callbackUrl - Optional callback URL to redirect to
 * @param status - User status (active, pending, inactive)
 */
export function redirectBasedOnRole(
  router: AppRouterInstance,
  role: string | null,
  callbackUrl?: string | null,
  status?: string | null
): void {
  // If there's a callback URL, use it
  if (callbackUrl) {
    router.push(decodeURI(callbackUrl));
    return;
  }

  // Check user status first
  if (status === 'pending') {
    router.push('/pending-approval');
    return;
  }

  if (status === 'inactive') {
    router.push('/account-inactive');
    return;
  }

  // Redirect based on role
  switch (role) {
    case 'admin':
      router.push('/admin');
      break;
    case 'manager':
      router.push('/dashboard');
      break;
    case 'staff':
    case 'user':
    default:
      router.push('/dashboard');
      break;
  }
}

/**
 * Handles login errors by setting appropriate error messages
 * 
 * @param error - Error object or message
 * @param setError - Function to set error message
 * @param incrementLoginAttempts - Optional function to increment login attempts
 */
export function handleLoginError(
  error: any,
  setError: (message: string) => void,
  incrementLoginAttempts?: () => void
): void {
  // Increment login attempts if function is provided
  if (incrementLoginAttempts) {
    incrementLoginAttempts();
  }

  // Handle different Firebase auth errors
  if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
    setError('Invalid email or password');
  } else if (error.code === 'auth/too-many-requests') {
    setError('Too many login attempts. Please try again later.');
  } else if (error.code === 'auth/user-disabled') {
    setError('This account has been disabled. Please contact support.');
  } else if (error.code === 'auth/network-request-failed') {
    setError('Network error. Please check your internet connection and try again.');
  } else if (error.code === 'auth/popup-closed-by-user') {
    setError('Login canceled. Please try again.');
  } else if (error.code === 'auth/popup-blocked') {
    setError('Login popup was blocked. Please allow popups for this site.');
  } else if (error.message) {
    setError('Failed to log in: ' + error.message);
  } else {
    setError('An error occurred during login');
  }
}

/**
 * Gets the callback URL from the current URL
 * 
 * @returns The callback URL or null if not present
 */
export function getCallbackUrl(): string | null {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('callbackUrl');
  }
  return null;
}

/**
 * Creates a login URL with a callback
 * 
 * @param callbackPath - Path to redirect to after login
 * @returns Full login URL with callback parameter
 */
export function createLoginUrl(callbackPath: string): string {
  return `/login?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

/**
 * Handles the logout process with proper cleanup
 * 
 * @param logoutFunction - The logout function from AuthContext
 * @param router - Next.js router instance
 * @param onBeforeLogout - Optional callback to run before logout
 * @param redirectUrl - Optional URL to redirect to after logout (defaults to '/login')
 */
export async function handleLogout(
  logoutFunction: (redirectUrl?: string) => Promise<string>,
  router: AppRouterInstance,
  onBeforeLogout?: () => void,
  redirectUrl?: string
): Promise<void> {
  try {
    // Run any pre-logout actions
    if (onBeforeLogout) {
      onBeforeLogout();
    }
    
    // Clear all auth data and get the redirect URL
    const logoutRedirectUrl = await logoutFunction(redirectUrl);
    
    // Add a small delay to ensure all state is cleared before redirecting
    setTimeout(() => {
      router.push(logoutRedirectUrl);
    }, 100);
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails, try to redirect to login
    router.push('/login');
  }
}

/**
 * Clears all client-side authentication data
 * This can be used as a fallback if the main logout process fails
 */
export function clearClientAuthData(): void {
  // Clear localStorage items
  if (typeof window !== 'undefined') {
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('loginLockout');
    localStorage.removeItem('authUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userStatus');
    
    // Clear any session storage items
    sessionStorage.removeItem('authUser');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userStatus');
    
    // Clear any auth-related cookies by setting them to expire
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userStatus=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'subscriptionActive=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
}

