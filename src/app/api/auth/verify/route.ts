import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = cookies().get('session')?.value;
    const userRole = cookies().get('userRole')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { authenticated: false, message: 'No session cookie found' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // In a real application, you would verify the token with Firebase Admin SDK
    // For now, we'll just check if the cookie exists and return a proper JSON response
    
    return new NextResponse(
      JSON.stringify({
        authenticated: true,
        role: userRole || 'user'
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error verifying session:', error);
    return new NextResponse(
      JSON.stringify({ 
        authenticated: false, 
        message: 'Failed to verify session' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}