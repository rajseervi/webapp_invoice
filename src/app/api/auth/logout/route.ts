
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Helper function to clear all auth-related cookies
 * @returns A response with success status
 */
async function clearAuthCookies() {
  try {
    // Clear all auth-related cookies with proper options
    const cookieOptions = {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as 'lax' | 'strict' | 'none',
    };
    
    // Get the cookies instance and await it
    const cookiesStore = await cookies();
    
    // Delete all auth-related cookies
    cookiesStore.delete('session', cookieOptions);
    cookiesStore.delete('userRole', cookieOptions);
    cookiesStore.delete('userStatus', cookieOptions);
    cookiesStore.delete('subscriptionActive', cookieOptions);
    
    // Clear any other potential auth-related cookies
    cookiesStore.delete('refreshToken', cookieOptions);
    cookiesStore.delete('idToken', cookieOptions);
    
    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  } catch (error) {
    console.error('Error clearing cookies:', error);
    return NextResponse.json(
      { success: false, message: 'Error during logout process' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
}

export async function GET(request: NextRequest) {
  return await clearAuthCookies();
}

export async function POST(request: NextRequest) {
  return await clearAuthCookies();
}