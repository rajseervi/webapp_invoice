import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Get the current path
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || 
                      path === '/register' || 
                      path === '/forgot-password' || 
                      path === '/reset-password' || 
                      path.startsWith('/api/auth/');
  
  // Define admin paths that require admin role
  const isAdminPath = path.startsWith('/admin');
  
  // Check if the user is authenticated
  const session = request.cookies.get('session')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  
  // Store the original URL to redirect after login
  const url = request.nextUrl.clone();
  
  // If the path requires authentication and the user is not authenticated, redirect to login
  if (!isPublicPath && !session) {
    const loginUrl = new URL('/login', request.url);
    // Add the original URL as a query parameter to redirect after login
    if (path !== '/') {
      loginUrl.searchParams.set('callbackUrl', encodeURI(url.pathname));
    }
    return NextResponse.redirect(loginUrl);
  }
  
  // If the user is authenticated and trying to access a public path, redirect to dashboard
  if (isPublicPath && session && path !== '/api/auth/logout') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If the path requires admin role and the user is not an admin, redirect to unauthorized
  if (isAdminPath && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
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