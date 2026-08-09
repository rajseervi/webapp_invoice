import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiInfo = {
      name: 'Master App API',
      version: '1.0.1',
      description: 'Comprehensive business management API',
      status: 'active',
      timestamp: new Date().toISOString(),
      endpoints: {
        admin: {
          path: '/api/admin',
          description: 'Administrative functions and system management',
          endpoints: [
            '/api/admin/dashboard',
            '/api/admin/dashboard-fallback',
            '/api/admin/notifications',
            '/api/admin/status',
            '/api/admin/test-realtime'
          ]
        },
        analytics: {
          path: '/api/analytics',
          description: 'Business analytics and reporting',
          endpoints: [
            '/api/analytics/dashboard'
          ]
        },
        auth: {
          path: '/api/auth',
          description: 'Authentication and session management',
          endpoints: [
            '/api/auth/logout',
            '/api/auth/session',
            '/api/auth/verify'
          ]
        },
        customers: {
          path: '/api/customers',
          description: 'Customer management and analytics',
          endpoints: [
            '/api/customers/top'
          ]
        },
        invoices: {
          path: '/api/invoices',
          description: 'Invoice management and processing',
          endpoints: [
            '/api/invoices/recent'
          ]
        },
        products: {
          path: '/api/products',
          description: 'Product management and operations',
          endpoints: [
            '/api/products/bulk-update',
            '/api/products/export',
            '/api/products/import'
          ]
        },
        websocket: {
          path: '/api/ws',
          description: 'WebSocket connections and real-time features',
          endpoints: [
            '/api/ws/dashboard'
          ]
        },
        utilities: {
          path: '/api/test-firebase',
          description: 'Testing and utility endpoints'
        }
      },
      health: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
      }
    };

    return NextResponse.json(apiInfo);
  } catch (error: any) {
    console.error('API Index Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load API information',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed on API root' },
    { status: 405 }
  );
}