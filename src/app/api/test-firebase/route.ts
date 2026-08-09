import { NextRequest, NextResponse } from 'next/server';
import { serverDb as db } from '@/lib/server-firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase connection...');
    
    const startTime = Date.now();
    
    // Test basic connection
    const testQuery = query(collection(db, 'invoices'), limit(1));
    const testSnapshot = await getDocs(testQuery);
    
    const responseTime = Date.now() - startTime;
    
    console.log('Firebase test successful:', {
      docsFound: testSnapshot.size,
      responseTime
    });
    
    return NextResponse.json({
      success: true,
      message: 'Firebase connection successful',
      data: {
        connected: true,
        responseTime,
        docsFound: testSnapshot.size,
        collections: {
          invoices: 'accessible'
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Firebase test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Firebase connection failed',
      details: {
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}