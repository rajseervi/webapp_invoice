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
        { status: 401 }
      );
    }

    // In a real application, you would verify the token with Firebase Admin SDK
    // For now, we'll just check if the cookie exists
    
    return NextResponse.json({
      authenticated: true,
      role: userRole || 'user'
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { authenticated: false, message: 'Failed to verify session' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}