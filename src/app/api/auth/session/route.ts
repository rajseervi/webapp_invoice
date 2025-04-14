import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { token, role, expiresIn } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    // Set the session cookie
    cookies().set({
      name: 'session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn || 60 * 60 * 24 * 5, // 5 days by default
      path: '/',
    });

    // Set the user role cookie
    if (role) {
      cookies().set({
        name: 'userRole',
        value: role,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expiresIn || 60 * 60 * 24 * 5, // 5 days by default
        path: '/',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting session:', error);
    return NextResponse.json(
      { error: 'Failed to set session' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // Clear the session cookie
  cookies().delete('session');
  cookies().delete('userRole');
  
  return NextResponse.json({ success: true });
}