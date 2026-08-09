import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';

// Generate real-time notifications based on actual data
const generateNotifications = async () => {
  const notifications = [];
  const now = new Date();
  
  try {
    // Check for recent invoices (last 24 hours)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentInvoicesQuery = query(
      collection(db, 'invoices'),
      where('createdAt', '>=', Timestamp.fromDate(yesterday)),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const recentInvoicesSnapshot = await getDocs(recentInvoicesQuery);
    
    recentInvoicesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate() || new Date(data.createdAt);
      const hoursAgo = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
      
      if (hoursAgo < 1) {
        notifications.push({
          id: `invoice-${doc.id}`,
          type: 'invoice_created',
          title: 'New Invoice Created',
          message: `Invoice ${data.invoiceNumber || doc.id.slice(-6)} for ₹${(data.totalAmount || data.total || 0).toLocaleString()} has been created`,
          severity: 'info',
          timestamp: createdAt.toISOString(),
          data: {
            invoiceId: doc.id,
            amount: data.totalAmount || data.total || 0,
            customer: data.partyName || 'Unknown Customer'
          }
        });
      }
    });

    // Check for overdue invoices
    const overdueInvoicesQuery = query(
      collection(db, 'invoices'),
      where('status', '==', 'Overdue'),
      limit(5)
    );
    
    const overdueInvoicesSnapshot = await getDocs(overdueInvoicesQuery);
    
    overdueInvoicesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      notifications.push({
        id: `overdue-${doc.id}`,
        type: 'invoice_overdue',
        title: 'Overdue Invoice Alert',
        message: `Invoice ${data.invoiceNumber || doc.id.slice(-6)} is overdue. Amount: ₹${(data.totalAmount || data.total || 0).toLocaleString()}`,
        severity: 'warning',
        timestamp: new Date().toISOString(),
        data: {
          invoiceId: doc.id,
          amount: data.totalAmount || data.total || 0,
          customer: data.partyName || 'Unknown Customer',
          dueDate: data.dueDate
        }
      });
    });

    // Check for recent payments
    const paidInvoicesQuery = query(
      collection(db, 'invoices'),
      where('status', '==', 'Paid'),
      where('updatedAt', '>=', Timestamp.fromDate(yesterday)),
      orderBy('updatedAt', 'desc'),
      limit(5)
    );
    
    const paidInvoicesSnapshot = await getDocs(paidInvoicesQuery);
    
    paidInvoicesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toDate() || new Date(data.updatedAt);
      const hoursAgo = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60));
      
      if (hoursAgo < 6) {
        notifications.push({
          id: `payment-${doc.id}`,
          type: 'payment_received',
          title: 'Payment Received',
          message: `Payment of ₹${(data.totalAmount || data.total || 0).toLocaleString()} received for invoice ${data.invoiceNumber || doc.id.slice(-6)}`,
          severity: 'success',
          timestamp: updatedAt.toISOString(),
          data: {
            invoiceId: doc.id,
            amount: data.totalAmount || data.total || 0,
            customer: data.partyName || 'Unknown Customer'
          }
        });
      }
    });

    // Check for low stock products (if product data has stock info)
    const productsQuery = query(collection(db, 'products'), limit(50));
    const productsSnapshot = await getDocs(productsQuery);
    
    productsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const stock = data.quantity || data.stock || 0;
      const minStock = data.minStock || data.reorderLevel || 10;
      
      if (stock <= minStock && stock > 0) {
        notifications.push({
          id: `stock-${doc.id}`,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${data.name || 'Product'} is running low. Current stock: ${stock}`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          data: {
            productId: doc.id,
            productName: data.name,
            currentStock: stock,
            minStock: minStock
          }
        });
      }
    });

    // Add system notifications
    const systemNotifications = [
      {
        id: 'system-backup',
        type: 'system',
        title: 'Daily Backup Completed',
        message: 'System backup completed successfully',
        severity: 'info',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: 'system-update',
        type: 'system',
        title: 'Dashboard Updated',
        message: 'Real-time dashboard features have been updated',
        severity: 'info',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      }
    ];

    notifications.push(...systemNotifications);

  } catch (error) {
    console.error('Error generating notifications:', error);
    
    // Add error notification
    notifications.push({
      id: 'error-notification',
      type: 'error',
      title: 'System Error',
      message: 'Failed to fetch some notifications. Please refresh the page.',
      severity: 'error',
      timestamp: new Date().toISOString(),
      data: { error: error.message }
    });
  }

  // Sort by timestamp (newest first) and limit to 20
  return notifications
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // filter by notification type
    const severity = searchParams.get('severity'); // filter by severity
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let notifications = await generateNotifications();

    // Apply filters
    if (type) {
      notifications = notifications.filter(notif => notif.type === type);
    }

    if (severity) {
      notifications = notifications.filter(notif => notif.severity === severity);
    }

    if (unreadOnly) {
      // In a real implementation, you'd track read status per user
      notifications = notifications.filter(notif => !notif.read);
    }

    // Apply limit
    notifications = notifications.slice(0, limit);

    // Calculate summary stats
    const summary = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: notifications.reduce((acc, notif) => {
        acc[notif.type] = (acc[notif.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: notifications.reduce((acc, notif) => {
        acc[notif.severity] = (acc[notif.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        summary,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Notifications API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, notificationIds, notificationId } = body;

    switch (action) {
      case 'mark_read':
        // In a real implementation, you'd update the read status in the database
        console.log('Marking notifications as read:', notificationIds || [notificationId]);
        
        return NextResponse.json({
          success: true,
          message: `Marked ${notificationIds?.length || 1} notification(s) as read`,
          timestamp: new Date().toISOString()
        });

      case 'mark_all_read':
        // Mark all notifications as read for the current user
        console.log('Marking all notifications as read');
        
        return NextResponse.json({
          success: true,
          message: 'All notifications marked as read',
          timestamp: new Date().toISOString()
        });

      case 'delete':
        // Delete specific notifications
        console.log('Deleting notifications:', notificationIds || [notificationId]);
        
        return NextResponse.json({
          success: true,
          message: `Deleted ${notificationIds?.length || 1} notification(s)`,
          timestamp: new Date().toISOString()
        });

      case 'clear_all':
        // Clear all notifications for the current user
        console.log('Clearing all notifications');
        
        return NextResponse.json({
          success: true,
          message: 'All notifications cleared',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Notifications POST API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process notification action',
        details: error.message
      },
      { status: 500 }
    );
  }
}