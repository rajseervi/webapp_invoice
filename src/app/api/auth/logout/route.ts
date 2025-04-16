
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Helper function to clear all auth-related cookies
 * @returns A response with success status
 */
function clearAuthCookies() {
  try {
    // Clear all auth-related cookies with proper options
    const cookieOptions = {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as 'lax' | 'strict' | 'none',
    };
    
    cookies().delete('session', cookieOptions);
    cookies().delete('userRole', cookieOptions);
    cookies().delete('userStatus', cookieOptions);
    cookies().delete('subscriptionActive', cookieOptions);
    
    // Clear any other potential auth-related cookies
    cookies().delete('refreshToken', cookieOptions);
    cookies().delete('idToken', cookieOptions);
    
    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error clearing cookies:', error);
    return NextResponse.json(
{ success: false, message: 'Error during logout process' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return clearAuthCookies();
}

export async function POST(request: NextRequest) {
  return clearAuthCookies();
}