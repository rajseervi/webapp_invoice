import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Get the current path and query parameters
  const path = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || 
                      path === '/register' || 
                      path === '/forgot-password' || 
                      path === '/reset-password' || 
                      path === '/pending-approval' ||
                      path === '/account-inactive' ||
                      path.startsWith('/api/auth/');
                      
  // Skip middleware for auth API endpoints to prevent interference
  if (path.startsWith('/api/auth/')) {
    return NextResponse.next();
  }
  
  // Define role-specific paths
  const isAdminPath = path.startsWith('/admin');
  const isManagerPath = path.startsWith('/reports') || path.startsWith('/analytics');
  
  // Check if the user is authenticated
  const session = request.cookies.get('session')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  const userStatus = request.cookies.get('userStatus')?.value;
  
  // Store the original URL to redirect after login
  const url = request.nextUrl.clone();
  
  // If the path requires authentication and the user is not authenticated, redirect to login
  if (!isPublicPath && !session) {
    const loginUrl = new URL('/login', request.url);
    
    // Add the original URL as a query parameter to redirect after login
    if (path !== '/') {
      // Include both path and query parameters in the callback URL
      const fullPath = searchParams.toString() 
        ? `${url.pathname}?${searchParams.toString()}`
        : url.pathname;
        
      loginUrl.searchParams.set('callbackUrl', encodeURI(fullPath));
    }
    
    return NextResponse.redirect(loginUrl);
  }
  
  // If the user is authenticated and trying to access a public path, redirect to appropriate dashboard
  if (isPublicPath && session && path !== '/api/auth/logout') {
    // Check if there's a callback URL in the query parameters
    const callbackUrl = searchParams.get('callbackUrl');
    
    if (callbackUrl) {
      return NextResponse.redirect(new URL(decodeURI(callbackUrl), request.url));
    }
    
    // If user status is pending, redirect to pending approval page
    if (userStatus === 'pending' && path !== '/pending-approval') {
      return NextResponse.redirect(new URL('/pending-approval', request.url));
    }
    
    // If user status is inactive, redirect to account inactive page
    if (userStatus === 'inactive' && path !== '/account-inactive') {
      return NextResponse.redirect(new URL('/account-inactive', request.url));
    }
    
    // Redirect based on user role
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else if (userRole === 'manager') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Role-based access control
  if (isAdminPath && userRole !== 'admin') {
    console.log('Admin access denied. User role:', userRole);
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  if (isManagerPath && userRole !== 'admin' && userRole !== 'manager') {
    console.log('Manager access denied. User role:', userRole);
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  // User status checks
  if (session && !isPublicPath) {
    if (userStatus === 'pending') {
      return NextResponse.redirect(new URL('/pending-approval', request.url));
    }
    
    if (userStatus === 'inactive') {
      return NextResponse.redirect(new URL('/account-inactive', request.url));
    }
  }
  
  // Continue with the request
  return NextResponse.next();
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: [
    // Protected routes that require authentication
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/projects/:path*',
    '/reports/:path*',
    
    // Public routes
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth/:path*',
    
    // Exclude static files and API routes that don't need auth checks
    '/((?!_next/static|_next/image|favicon.ico|api/public).*)',
  ],
};