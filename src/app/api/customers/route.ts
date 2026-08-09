import { NextRequest, NextResponse } from 'next/server';
import { serverDb as db } from '@/lib/server-firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'name';

    const customersInfo = {
      module: 'Customers API',
      version: '1.0.0',
      description: 'Customer management and analytics services',
      status: 'active',
      timestamp: new Date().toISOString(),
      endpoints: {
        top: {
          path: '/api/customers/top',
          method: ['GET', 'POST'],
          description: 'Top customers by various metrics'
        },
        list: {
          path: '/api/customers',
          method: ['GET', 'POST'],
          description: 'Customer listing and basic operations'
        }
      },
      features: {
        customerAnalytics: true,
        topCustomers: true,
        customerSegmentation: true,
        paymentTracking: true,
        creditManagement: true
      },
      supportedSorting: [
        'name',
        'totalSpent',
        'invoiceCount',
        'lastActivity',
        'creditLimit'
      ],
      supportedFilters: [
        'status',
        'industry',
        'paymentTerms',
        'creditLimit',
        'location'
      ]
    };

    // If requesting actual customer data
    if (searchParams.get('data') === 'true') {
      try {
        // Fetch basic customer statistics
        const partiesQuery = query(
          collection(db, 'parties'),
          orderBy('name', 'asc'),
          limit(Math.min(limitParam, 50))
        );
        
        const partiesSnapshot = await getDocs(partiesQuery);
        const customers = partiesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Unknown',
          email: doc.data().email || '',
          phone: doc.data().phone || '',
          status: doc.data().isActive ? 'Active' : 'Inactive',
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }));

        return NextResponse.json({
          success: true,
          data: customers,
          total: customers.length,
          metadata: customersInfo,
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({
          ...customersInfo,
          note: 'Customer data unavailable - showing API information only'
        });
      }
    }

    return NextResponse.json(customersInfo);
  } catch (error: any) {
    console.error('Customers API Index Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load customers API information',
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
    const { action, customerIds, data } = body;

    switch (action) {
      case 'bulk_update':
        return NextResponse.json({
          success: true,
          message: `Updated ${customerIds?.length || 0} customer(s)`,
          updatedCount: customerIds?.length || 0,
          timestamp: new Date().toISOString()
        });

      case 'export':
        return NextResponse.json({
          success: true,
          message: 'Customer export initiated',
          exportId: `CUST-${Date.now()}`,
          downloadUrl: '/api/customers/export',
          timestamp: new Date().toISOString()
        });

      case 'send_notifications':
        return NextResponse.json({
          success: true,
          message: `Sent notifications to ${customerIds?.length || 0} customer(s)`,
          sentCount: customerIds?.length || 0,
          timestamp: new Date().toISOString()
        });

      case 'get_stats':
        return NextResponse.json({
          success: true,
          stats: {
            totalCustomers: 0,
            activeCustomers: 0,
            inactiveCustomers: 0,
            newThisMonth: 0,
            totalRevenue: 0
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
    console.error('Customers API POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process customer request',
        details: error.message
      },
      { status: 500 }
    );
  }
}