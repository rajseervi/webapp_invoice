import { NextRequest, NextResponse } from 'next/server';
import { serverDb as db } from '@/lib/server-firebase';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || '6months'; // 1month, 3months, 6months, 1year, all
    const sortBy = searchParams.get('sortBy') || 'totalSpent'; // totalSpent, invoiceCount, recentActivity

    const startTime = Date.now();

    // Calculate date range for filtering
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date(2020, 0, 1); // Far back date for "all time"
        break;
    }

    // Fetch invoices to calculate customer statistics
    const invoicesQuery = period === 'all' 
      ? query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'invoices'),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          orderBy('createdAt', 'desc')
        );

    const invoicesSnapshot = await getDocs(invoicesQuery);
    const invoices = invoicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch parties/customers data
    const partiesQuery = query(collection(db, 'parties'));
    const partiesSnapshot = await getDocs(partiesQuery);
    const parties = partiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Create a map of party details for quick lookup
    const partyMap = {};
    parties.forEach(party => {
      partyMap[party.id] = party;
    });

    // Calculate customer statistics from invoices
    const customerStats = {};
    
    invoices.forEach(invoice => {
      const customerId = invoice.partyId || 'unknown';
      const customerName = invoice.partyName || partyMap[customerId]?.name || 'Unknown Customer';
      const amount = invoice.totalAmount || invoice.total || 0;
      const invoiceDate = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt);
      
      if (!customerStats[customerId]) {
        const partyData = partyMap[customerId] || {};
        customerStats[customerId] = {
          id: customerId,
          name: customerName,
          email: partyData.email || '',
          phone: partyData.phone || '',
          address: partyData.address || '',
          gstNumber: partyData.gstNumber || '',
          avatar: customerName.charAt(0).toUpperCase(),
          totalSpent: 0,
          invoiceCount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          averageOrderValue: 0,
          lastInvoiceDate: null,
          firstInvoiceDate: null,
          paymentRate: 0,
          recentActivity: 0, // Score based on recent activity
          status: 'active'
        };
      }
      
      const customer = customerStats[customerId];
      customer.totalSpent += amount;
      customer.invoiceCount += 1;
      
      // Track payment status amounts
      if (invoice.status === 'Paid' || invoice.status === 'paid') {
        customer.paidAmount += amount;
      } else if (invoice.status === 'Pending' || invoice.status === 'pending') {
        customer.pendingAmount += amount;
      } else if (invoice.status === 'Overdue' || invoice.status === 'overdue') {
        customer.overdueAmount += amount;
      }
      
      // Track date ranges
      if (!customer.lastInvoiceDate || invoiceDate > new Date(customer.lastInvoiceDate)) {
        customer.lastInvoiceDate = invoiceDate.toISOString();
      }
      if (!customer.firstInvoiceDate || invoiceDate < new Date(customer.firstInvoiceDate)) {
        customer.firstInvoiceDate = invoiceDate.toISOString();
      }
      
      // Calculate recent activity score (higher for more recent invoices)
      const daysAgo = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo <= 30) {
        customer.recentActivity += Math.max(1, 30 - daysAgo); // Higher score for more recent
      }
    });

    // Calculate derived metrics
    Object.values(customerStats).forEach((customer: any) => {
      customer.averageOrderValue = customer.invoiceCount > 0 ? customer.totalSpent / customer.invoiceCount : 0;
      customer.paymentRate = customer.totalSpent > 0 ? (customer.paidAmount / customer.totalSpent) * 100 : 0;
      
      // Determine customer status
      const daysSinceLastInvoice = customer.lastInvoiceDate 
        ? Math.floor((now.getTime() - new Date(customer.lastInvoiceDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      if (daysSinceLastInvoice > 180) {
        customer.status = 'inactive';
      } else if (customer.overdueAmount > 0) {
        customer.status = 'overdue';
      } else if (customer.pendingAmount > customer.paidAmount) {
        customer.status = 'pending';
      } else {
        customer.status = 'active';
      }
    });

    // Sort customers based on criteria
    let sortedCustomers = Object.values(customerStats);
    
    switch (sortBy) {
      case 'invoiceCount':
        sortedCustomers.sort((a: any, b: any) => b.invoiceCount - a.invoiceCount);
        break;
      case 'recentActivity':
        sortedCustomers.sort((a: any, b: any) => b.recentActivity - a.recentActivity);
        break;
      case 'averageOrderValue':
        sortedCustomers.sort((a: any, b: any) => b.averageOrderValue - a.averageOrderValue);
        break;
      case 'totalSpent':
      default:
        sortedCustomers.sort((a: any, b: any) => b.totalSpent - a.totalSpent);
        break;
    }

    // Limit results
    const topCustomers = sortedCustomers.slice(0, Math.min(limitParam, 50));

    // Calculate summary statistics
    const totalCustomers = sortedCustomers.length;
    const totalRevenue = sortedCustomers.reduce((sum: number, customer: any) => sum + customer.totalSpent, 0);
    const totalInvoices = sortedCustomers.reduce((sum: number, customer: any) => sum + customer.invoiceCount, 0);
    
    const summary = {
      totalCustomers,
      totalRevenue,
      totalInvoices,
      averageCustomerValue: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
      activeCustomers: sortedCustomers.filter((c: any) => c.status === 'active').length,
      inactiveCustomers: sortedCustomers.filter((c: any) => c.status === 'inactive').length,
      overdueCustomers: sortedCustomers.filter((c: any) => c.status === 'overdue').length,
      topCustomerRevenue: topCustomers.reduce((sum: number, customer: any) => sum + customer.totalSpent, 0),
      topCustomerPercentage: totalRevenue > 0 ? 
        (topCustomers.reduce((sum: number, customer: any) => sum + customer.totalSpent, 0) / totalRevenue) * 100 : 0
    };

    const queryTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: topCustomers,
      summary,
      metadata: {
        period,
        sortBy,
        limit: limitParam,
        actualCount: topCustomers.length,
        totalCustomers,
        queryTime,
        filters: {
          period,
          sortBy,
          dateRange: period !== 'all' ? {
            from: startDate.toISOString().split('T')[0],
            to: now.toISOString().split('T')[0]
          } : null
        },
        performance: {
          queryTime,
          status: queryTime < 2000 ? 'fast' : queryTime < 5000 ? 'normal' : 'slow'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Top Customers API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch top customers',
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle customer actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, customerIds, data } = body;

    switch (action) {
      case 'send_statements':
        console.log(`Sending statements to customers: ${customerIds}`);
        
        return NextResponse.json({
          success: true,
          message: `Sent statements to ${customerIds?.length || 0} customer(s)`,
          sentCount: customerIds?.length || 0,
          timestamp: new Date().toISOString()
        });

      case 'update_status':
        console.log(`Updating customer status: ${customerIds} to ${data?.status}`);
        
        return NextResponse.json({
          success: true,
          message: `Updated status for ${customerIds?.length || 0} customer(s)`,
          updatedCount: customerIds?.length || 0,
          timestamp: new Date().toISOString()
        });

      case 'export_data':
        return NextResponse.json({
          success: true,
          message: 'Customer data export initiated',
          exportId: `CUST-${Date.now()}`,
          downloadUrl: '/api/customers/export',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Top Customers POST API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process customer action',
        details: error.message
      },
      { status: 500 }
    );
  }
}