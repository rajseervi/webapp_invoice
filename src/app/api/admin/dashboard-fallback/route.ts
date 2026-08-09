import { NextRequest, NextResponse } from 'next/server';

// Fallback dashboard data when Firebase is not accessible
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '6months';
    
    // Generate realistic mock data
    const now = new Date();
    const mockData = {
      overview: {
        totalRevenue: 2847650,
        totalInvoices: 1247,
        totalCustomers: 89,
        totalProducts: 156,
        pendingPayments: 485200,
        monthlyGrowth: 12.5,
        invoiceGrowth: 8.3,
        customerGrowth: 5.2,
        paymentGrowth: -2.1,
        averageInvoiceValue: 2284.50,
        paymentRate: 82.5,
        overdueCount: 23
      },
      chartData: {
        invoiceRevenue: [
          { month: 'Jan', invoices: 45, revenue: 125000, payments: 98000 },
          { month: 'Feb', invoices: 52, revenue: 145000, payments: 125000 },
          { month: 'Mar', invoices: 48, revenue: 135000, payments: 110000 },
          { month: 'Apr', invoices: 61, revenue: 175000, payments: 145000 },
          { month: 'May', invoices: 58, revenue: 165000, payments: 155000 },
          { month: 'Jun', invoices: 67, revenue: 195000, payments: 175000 }
        ],
        paymentStatus: [
          { name: 'Paid', value: 1028, color: '#4caf50' },
          { name: 'Pending', value: 156, color: '#ff9800' },
          { name: 'Overdue', value: 23, color: '#f44336' },
          { name: 'Draft', value: 40, color: '#9e9e9e' }
        ],
        topProducts: [
          { name: 'Product A', sales: 89, revenue: 45000 },
          { name: 'Product B', sales: 76, revenue: 38000 },
          { name: 'Product C', sales: 65, revenue: 32500 },
          { name: 'Product D', sales: 54, revenue: 27000 },
          { name: 'Product E', sales: 43, revenue: 21500 }
        ]
      },
      recentInvoices: [
        {
          id: 'inv-001',
          invoiceNumber: 'INV-2024-001',
          customer: 'Acme Corporation',
          amount: 15750,
          status: 'Paid',
          date: '2024-01-15',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'inv-002',
          invoiceNumber: 'INV-2024-002',
          customer: 'Tech Solutions Ltd',
          amount: 8900,
          status: 'Pending',
          date: '2024-01-14',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'inv-003',
          invoiceNumber: 'INV-2024-003',
          customer: 'Global Industries',
          amount: 22400,
          status: 'Paid',
          date: '2024-01-13',
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'inv-004',
          invoiceNumber: 'INV-2024-004',
          customer: 'StartUp Inc',
          amount: 5600,
          status: 'Overdue',
          date: '2024-01-12',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'inv-005',
          invoiceNumber: 'INV-2024-005',
          customer: 'Enterprise Corp',
          amount: 31200,
          status: 'Paid',
          date: '2024-01-11',
          createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
        }
      ],
      topCustomers: [
        {
          id: 'cust-001',
          name: 'Acme Corporation',
          avatar: 'A',
          totalSpent: 125000,
          invoices: 15,
          status: 'active'
        },
        {
          id: 'cust-002',
          name: 'Tech Solutions Ltd',
          avatar: 'T',
          totalSpent: 98000,
          invoices: 12,
          status: 'active'
        },
        {
          id: 'cust-003',
          name: 'Global Industries',
          avatar: 'G',
          totalSpent: 87500,
          invoices: 10,
          status: 'active'
        },
        {
          id: 'cust-004',
          name: 'Enterprise Corp',
          avatar: 'E',
          totalSpent: 76200,
          invoices: 8,
          status: 'active'
        },
        {
          id: 'cust-005',
          name: 'StartUp Inc',
          avatar: 'S',
          totalSpent: 45600,
          invoices: 6,
          status: 'overdue'
        }
      ],
      recentActivity: [
        {
          type: 'invoice_created',
          message: 'New invoice INV-2024-001 created for Acme Corporation',
          amount: 15750,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          severity: 'info'
        },
        {
          type: 'payment_received',
          message: 'Payment of ₹22,400 received for invoice INV-2024-003',
          amount: 22400,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          severity: 'success'
        },
        {
          type: 'invoice_overdue',
          message: 'Invoice INV-2024-004 is overdue',
          amount: 5600,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          severity: 'warning'
        },
        {
          type: 'invoice_created',
          message: 'New invoice INV-2024-005 created for Enterprise Corp',
          amount: 31200,
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          severity: 'info'
        }
      ],
      systemHealth: {
        database: 'healthy',
        responseTime: 150,
        errors: []
      },
      metadata: {
        period,
        responseTime: 150,
        refresh: false,
        includeAdvanced: false,
        dataFreshness: 'mock',
        cacheStatus: 'fallback',
        queryPerformance: {
          invoicesQuery: 'mock',
          partiesQuery: 'mock',
          productsQuery: 'mock'
        }
      },
      loading: false,
      error: null,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: mockData,
      isMockData: true,
      message: 'Using fallback mock data',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Fallback Dashboard API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate fallback dashboard data',
        details: error.message
      },
      { status: 500 }
    );
  }
}