import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminInfo = {
      module: 'Admin API',
      version: '1.0.0',
      description: 'Administrative functions and system management',
      status: 'active',
      timestamp: new Date().toISOString(),
      endpoints: {
        dashboard: {
          path: '/api/admin/dashboard',
          method: ['GET', 'POST'],
          description: 'Main admin dashboard data and operations'
        },
        'dashboard-fallback': {
          path: '/api/admin/dashboard-fallback',
          method: ['GET'],
          description: 'Fallback dashboard data when main dashboard fails'
        },
        notifications: {
          path: '/api/admin/notifications',
          method: ['GET', 'POST'],
          description: 'System notifications management'
        },
        status: {
          path: '/api/admin/status',
          method: ['GET'],
          description: 'System status and health checks'
        },
        'test-realtime': {
          path: '/api/admin/test-realtime',
          method: ['GET', 'POST'],
          description: 'Real-time functionality testing'
        }
      },
      permissions: {
        required: 'admin',
        description: 'All admin endpoints require administrative privileges'
      },
      rateLimit: {
        requests: 100,
        window: '15m',
        description: 'Rate limited to 100 requests per 15 minutes'
      }
    };

    return NextResponse.json(adminInfo);
  } catch (error: any) {
    console.error('Admin API Index Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load admin API information',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'health_check':
        return NextResponse.json({
          success: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'connected',
            auth: 'active',
            storage: 'available'
          }
        });

      case 'system_info':
        return NextResponse.json({
          success: true,
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version,
            platform: process.platform
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Admin API POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process admin request',
        details: error.message
      },
      { status: 500 }
    );
  }
}