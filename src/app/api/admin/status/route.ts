import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Test database connectivity
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    let totalDocuments = 0;
    
    try {
      const dbStartTime = Date.now();
      
      // Quick test queries to check database health
      const [invoicesSnapshot, partiesSnapshot, productsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'invoices'), limit(1))),
        getDocs(query(collection(db, 'parties'), limit(1))),
        getDocs(query(collection(db, 'products'), limit(1)))
      ]);
      
      dbResponseTime = Date.now() - dbStartTime;
      totalDocuments = invoicesSnapshot.size + partiesSnapshot.size + productsSnapshot.size;
      
      if (dbResponseTime > 5000) {
        dbStatus = 'slow';
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      dbStatus = 'error';
      dbResponseTime = Date.now() - startTime;
    }

    // Get recent activity
    let recentActivity = [];
    try {
      const recentInvoicesQuery = query(
        collection(db, 'invoices'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentInvoicesSnapshot = await getDocs(recentInvoicesQuery);
      
      recentActivity = recentInvoicesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          type: 'invoice',
          action: 'created',
          id: doc.id,
          timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          details: {
            invoiceNumber: data.invoiceNumber,
            amount: data.totalAmount || data.total || 0,
            customer: data.partyName || 'Unknown'
          }
        };
      });
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }

    // Calculate system metrics
    const totalResponseTime = Date.now() - startTime;
    
    const systemStatus = {
      status: dbStatus === 'healthy' && totalResponseTime < 2000 ? 'healthy' : 
              dbStatus === 'error' ? 'error' : 'degraded',
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    const performance = {
      apiResponseTime: totalResponseTime,
      databaseResponseTime: dbResponseTime,
      memoryUsage: process.memoryUsage ? {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      } : null
    };

    const database = {
      status: dbStatus,
      responseTime: dbResponseTime,
      totalDocuments,
      collections: {
        invoices: 'connected',
        parties: 'connected',
        products: 'connected'
      }
    };

    const realtime = {
      websocketEnabled: false, // Next.js limitation
      pollingInterval: 30000,
      activeConnections: 0, // Would track actual connections in real implementation
      lastUpdate: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        system: systemStatus,
        performance,
        database,
        realtime,
        recentActivity,
        checks: {
          database: dbStatus === 'healthy',
          api: totalResponseTime < 2000,
          memory: performance.memoryUsage ? performance.memoryUsage.heapUsed < 512 : true
        }
      }
    });
  } catch (error) {
    console.error('System status check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'System status check failed',
      data: {
        system: {
          status: 'error',
          uptime: 0,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        },
        performance: {
          apiResponseTime: Date.now(),
          databaseResponseTime: 0,
          memoryUsage: null
        },
        database: {
          status: 'error',
          responseTime: 0,
          totalDocuments: 0,
          collections: {
            invoices: 'error',
            parties: 'error',
            products: 'error'
          }
        },
        realtime: {
          websocketEnabled: false,
          pollingInterval: 30000,
          activeConnections: 0,
          lastUpdate: new Date().toISOString()
        },
        recentActivity: [],
        checks: {
          database: false,
          api: false,
          memory: false
        }
      }
    }, { status: 500 });
  }
}