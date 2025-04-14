import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // Clear the session cookies
  cookies().delete('session');
  cookies().delete('userRole');
  
  return NextResponse.json({ success: true });
}

export async function POST() {
  // Clear the session cookies
  cookies().delete('session');
  cookies().delete('userRole');
  
  return NextResponse.json({ success: true });
}