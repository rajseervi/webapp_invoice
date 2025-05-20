import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { token, role, status, subscriptionActive, expiresIn } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    // Common cookie options
    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as 'lax' | 'strict' | 'none',
      maxAge: expiresIn || 60 * 60 * 24 * 5, // 5 days by default
      path: '/',
    };

    // Get the cookie store (needs to be awaited in Next.js 14+)
    const cookieStore = await cookies();

    // Set the session cookie
    cookieStore.set({
      name: 'session',
      value: token,
      httpOnly: true,
      ...cookieOptions,
    });

    // Set the user role cookie
    if (role) {
      cookieStore.set({
        name: 'userRole',
        value: role,
        httpOnly: false, // Allow JavaScript access to this cookie
        ...cookieOptions,
      });
    }

    // Set the user status cookie
    if (status) {
      cookieStore.set({
        name: 'userStatus',
        value: status,
        httpOnly: false, // Allow JavaScript access to this cookie
        ...cookieOptions,
      });
    }

    // Set the subscription status cookie
    if (subscriptionActive !== undefined) {
      cookieStore.set({
        name: 'subscriptionActive',
        value: subscriptionActive.toString(),
        httpOnly: false, // Allow JavaScript access to this cookie
        ...cookieOptions,
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
  // Clear the session cookies
  const cookieOptions = { path: '/' };
  
  // Get the cookie store (needs to be awaited in Next.js 14+)
  const cookieStore = await cookies();
  
  cookieStore.delete('session', cookieOptions);
  cookieStore.delete('userRole', cookieOptions);
  cookieStore.delete('userStatus', cookieOptions);
  cookieStore.delete('subscriptionActive', cookieOptions);
  
  return NextResponse.json({ success: true });
}