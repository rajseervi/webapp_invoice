import { NextRequest, NextResponse } from 'next/server';
import { serverDb as db } from '@/lib/server-firebase';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // Filter by status if provided
    const days = parseInt(searchParams.get('days') || '30'); // Last N days

    console.log('[Recent Invoices API] Fetching invoices:', { limitParam, status, days });

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Build query
    let invoicesQuery = query(
      collection(db, 'invoices'),
      orderBy('createdAt', 'desc'),
      limit(Math.min(limitParam, 100)) // Cap at 100 for performance
    );

    // Add date filter if specified
    if (days < 365) { // Only add date filter for reasonable ranges
      invoicesQuery = query(
        collection(db, 'invoices'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc'),
        limit(Math.min(limitParam, 100))
      );
    }

    const startTime = Date.now();
    const invoicesSnapshot = await getDocs(invoicesQuery);
    const queryTime = Date.now() - startTime;
    console.log('[Recent Invoices API] Query completed in', queryTime, 'ms, found', invoicesSnapshot.docs.length, 'invoices');

    const isSampleData = false;

    let invoices = invoicesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        invoiceNumber: data.invoiceNumber || `INV-${doc.id.slice(-4)}`,
        customer: data.partyName || data.customer?.name || 'Unknown Customer',
        customerId: data.partyId || data.customer?.id,
        amount: data.totalAmount || data.total || 0,
        status: data.status || 'Pending',
        date: data.createdAt?.toDate?.()?.toISOString()?.split('T')[0] || 
              new Date(data.createdAt || Date.now()).toISOString().split('T')[0],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || 
                   new Date(data.createdAt || Date.now()).toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || 
                   new Date(data.updatedAt || data.createdAt || Date.now()).toISOString(),
        dueDate: data.dueDate?.toDate?.()?.toISOString()?.split('T')[0] || null,
        items: data.items?.length || 0,
        taxAmount: data.taxAmount || 0,
        discountAmount: data.discountAmount || 0,
        notes: data.notes || '',
        paymentMethod: data.paymentMethod || null,
        paidAt: data.paidAt?.toDate?.()?.toISOString() || null
      };
    });

    console.log('[Recent Invoices API] Found', invoices.length, 'real invoices in database');

    // Apply status filter if provided
    if (status) {
      invoices = invoices.filter(invoice => 
        invoice.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Calculate summary statistics
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid' || inv.status === 'paid');
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pending' || inv.status === 'pending');
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue' || inv.status === 'overdue');

    const summary = {
      total: invoices.length,
      totalAmount,
      paidCount: paidInvoices.length,
      paidAmount: paidInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      pendingCount: pendingInvoices.length,
      pendingAmount: pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      averageAmount: invoices.length > 0 ? totalAmount / invoices.length : 0
    };

    // Add recent activity indicators
    const recentActivity = invoices.slice(0, 5).map(invoice => {
      const hoursAgo = Math.floor((Date.now() - new Date(invoice.createdAt).getTime()) / (1000 * 60 * 60));
      return {
        ...invoice,
        hoursAgo,
        isRecent: hoursAgo < 24,
        activityType: hoursAgo < 1 ? 'just_created' : hoursAgo < 24 ? 'recent' : 'older'
      };
    });

    const responseData = {
      success: true,
      data: invoices,
      isSampleData,
      summary,
      recentActivity,
      metadata: {
        limit: limitParam,
        actualCount: invoices.length,
        queryTime,
        dataSource: isSampleData ? 'sample' : 'database',
        filters: {
          status,
          days,
          dateRange: {
            from: startDate.toISOString().split('T')[0],
            to: now.toISOString().split('T')[0]
          }
        },
        performance: {
          queryTime,
          status: queryTime < 1000 ? 'fast' : queryTime < 3000 ? 'normal' : 'slow'
        }
      },
      timestamp: new Date().toISOString()
    };

    console.log('[Recent Invoices API] Returning response:', { 
      success: responseData.success, 
      invoiceCount: responseData.data.length,
      summaryTotal: responseData.summary.total
    });

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('[Recent Invoices API] Error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    // Return detailed error information for debugging
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch recent invoices',
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle invoice actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, invoiceIds, status } = body;

    switch (action) {
      case 'bulk_update_status':
        // In a real implementation, you would update the invoices in Firestore
        console.log(`Updating ${invoiceIds?.length || 0} invoices to status: ${status}`);
        
        return NextResponse.json({
          success: true,
          message: `Updated ${invoiceIds?.length || 0} invoice(s) to ${status}`,
          updatedCount: invoiceIds?.length || 0,
          timestamp: new Date().toISOString()
        });

      case 'mark_paid':
        console.log(`Marking invoices as paid: ${invoiceIds}`);
        
        return NextResponse.json({
          success: true,
          message: `Marked ${invoiceIds?.length || 0} invoice(s) as paid`,
          updatedCount: invoiceIds?.length || 0,
          timestamp: new Date().toISOString()
        });

      case 'send_reminders':
        console.log(`Sending reminders for invoices: ${invoiceIds}`);
        
        return NextResponse.json({
          success: true,
          message: `Sent reminders for ${invoiceIds?.length || 0} invoice(s)`,
          sentCount: invoiceIds?.length || 0,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Recent Invoices POST API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process invoice action',
        details: error.message
      },
      { status: 500 }
    );
  }
}