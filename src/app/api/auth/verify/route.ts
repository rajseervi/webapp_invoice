import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get the cookies store (needs to be awaited in Next.js 14+)
    const cookieStore = await cookies();
    
    // Then access the cookies (get() doesn't need to be awaited)
    const sessionCookie = cookieStore.get('session')?.value;
    const userRole = cookieStore.get('userRole')?.value;
    const userStatus = cookieStore.get('userStatus')?.value;
    
    // Set common headers for all responses
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    };
    
    if (!sessionCookie) {
      return NextResponse.json(
        { authenticated: false, message: 'No session cookie found' },
        { status: 401, headers }
      );
    }

    // In a real application, you would verify the token with Firebase Admin SDK
    // For now, we'll just check if the cookie exists and return a proper JSON response
    
    return NextResponse.json({
      authenticated: true,
      role: userRole || 'user',
      status: userStatus || 'active'
    }, { 
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    
    // Ensure we always return a proper JSON response even in case of errors
    return NextResponse.json({ 
      authenticated: false, 
      message: 'Failed to verify session' 
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  }
}