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

    // Get the cookies instance
    const cookieStore = cookies();
    
    // Set the session cookie
    await cookieStore.set({
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
      await cookieStore.set({
        name: 'userRole',
        value: role,
        httpOnly: false, // Allow JavaScript access to this cookie
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expiresIn || 60 * 60 * 24 * 5, // 5 days by default
        path: '/',
      });
    }

    // Set the user status cookie
    if (status) {
      await cookieStore.set({
        name: 'userStatus',
        value: status,
        httpOnly: false, // Allow JavaScript access to this cookie
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expiresIn || 60 * 60 * 24 * 5, // 5 days by default
        path: '/',
      });
    }

    // Set the subscription status cookie
    if (subscriptionActive !== undefined) {
      await cookieStore.set({
        name: 'subscriptionActive',
        value: subscriptionActive.toString(),
        httpOnly: false, // Allow JavaScript access to this cookie
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
  // Clear the session cookies
  const cookieStore = cookies();
  await cookieStore.delete('session');
  await cookieStore.delete('userRole');
  await cookieStore.delete('userStatus');
  await cookieStore.delete('subscriptionActive');
  
  return NextResponse.json({ success: true });
}