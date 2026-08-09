import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to verify all real-time dashboard APIs are working
export async function GET(request: NextRequest) {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  const baseUrl = request.url.replace('/api/admin/test-realtime', '');

  // Test cases
  const tests = [
    {
      name: 'Dashboard Data API',
      endpoint: '/api/admin/dashboard',
      expectedFields: ['overview', 'chartData', 'recentInvoices', 'topCustomers']
    },
    {
      name: 'Recent Invoices API',
      endpoint: '/api/invoices/recent?limit=5',
      expectedFields: ['data', 'total', 'timestamp']
    },
    {
      name: 'Top Customers API',
      endpoint: '/api/customers/top?limit=5',
      expectedFields: ['data', 'total', 'timestamp']
    },
    {
      name: 'Analytics Dashboard API',
      endpoint: '/api/analytics/dashboard?period=6months',
      expectedFields: ['chartData', 'metrics']
    },
    {
      name: 'System Status API',
      endpoint: '/api/admin/status',
      expectedFields: ['system', 'performance', 'database', 'realtime']
    },
    {
      name: 'Notifications API',
      endpoint: '/api/admin/notifications?limit=10',
      expectedFields: ['notifications', 'summary']
    }
  ];

  // Run tests
  for (const test of tests) {
    testResults.summary.total++;
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}${test.endpoint}`);
      const responseTime = Date.now() - startTime;
      
      const data = await response.json();
      
      const testResult = {
        name: test.name,
        endpoint: test.endpoint,
        status: response.ok ? 'PASSED' : 'FAILED',
        responseTime,
        statusCode: response.status,
        issues: []
      };

      if (!response.ok) {
        testResult.issues.push(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
        testResults.summary.failed++;
      } else {
        // Check for expected fields
        const dataToCheck = data.success ? data.data : data;
        
        for (const field of test.expectedFields) {
          if (!(field in dataToCheck)) {
            testResult.issues.push(`Missing expected field: ${field}`);
            testResult.status = 'WARNING';
          }
        }

        // Performance checks
        if (responseTime > 5000) {
          testResult.issues.push(`Slow response time: ${responseTime}ms`);
          testResult.status = testResult.status === 'PASSED' ? 'WARNING' : testResult.status;
        }

        if (testResult.status === 'PASSED') {
          testResults.summary.passed++;
        } else if (testResult.status === 'WARNING') {
          testResults.summary.warnings++;
        } else {
          testResults.summary.failed++;
        }
      }

      testResults.tests.push(testResult);
      
    } catch (error) {
      testResults.tests.push({
        name: test.name,
        endpoint: test.endpoint,
        status: 'FAILED',
        responseTime: 0,
        statusCode: 0,
        issues: [`Network error: ${error.message}`]
      });
      testResults.summary.failed++;
    }
  }

  // Additional system checks
  const systemChecks = {
    name: 'System Health Checks',
    endpoint: 'internal',
    status: 'PASSED',
    responseTime: 0,
    statusCode: 200,
    issues: []
  };

  // Check Node.js version
  const nodeVersion = process.version;
  if (!nodeVersion.startsWith('v18') && !nodeVersion.startsWith('v20')) {
    systemChecks.issues.push(`Node.js version ${nodeVersion} may not be optimal. Recommended: v18 or v20`);
    systemChecks.status = 'WARNING';
  }

  // Check environment
  const env = process.env.NODE_ENV;
  if (env !== 'development' && env !== 'production') {
    systemChecks.issues.push(`Unknown environment: ${env}`);
    systemChecks.status = 'WARNING';
  }

  // Check memory usage
  if (process.memoryUsage) {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    if (heapUsedMB > 512) {
      systemChecks.issues.push(`High memory usage: ${heapUsedMB}MB`);
      systemChecks.status = 'WARNING';
    }
  }

  testResults.tests.push(systemChecks);
  testResults.summary.total++;
  
  if (systemChecks.status === 'PASSED') {
    testResults.summary.passed++;
  } else {
    testResults.summary.warnings++;
  }

  // Generate recommendations
  const recommendations = [];
  
  if (testResults.summary.failed > 0) {
    recommendations.push('Fix failed API endpoints before deploying to production');
  }
  
  if (testResults.summary.warnings > 0) {
    recommendations.push('Review warnings to optimize performance and reliability');
  }
  
  const avgResponseTime = testResults.tests
    .filter(t => t.responseTime > 0)
    .reduce((sum, t) => sum + t.responseTime, 0) / 
    testResults.tests.filter(t => t.responseTime > 0).length;
    
  if (avgResponseTime > 2000) {
    recommendations.push('Consider optimizing API response times');
  }

  if (testResults.summary.passed === testResults.summary.total) {
    recommendations.push('All systems operational! Dashboard is ready for real-time monitoring');
  }

  const overallStatus = testResults.summary.failed > 0 ? 'FAILED' : 
                       testResults.summary.warnings > 0 ? 'WARNING' : 'PASSED';

  return NextResponse.json({
    success: overallStatus !== 'FAILED',
    status: overallStatus,
    ...testResults,
    recommendations,
    systemInfo: {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      platform: process.platform,
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      memoryUsage: process.memoryUsage ? {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      } : null
    }
  });
}

// Test specific API endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, method = 'GET', payload } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const baseUrl = request.url.replace('/api/admin/test-realtime', '');
    const fullUrl = `${baseUrl}${endpoint}`;

    const startTime = Date.now();
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (payload && method !== 'GET') {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(fullUrl, fetchOptions);
    const responseTime = Date.now() - startTime;
    const data = await response.json();

    return NextResponse.json({
      success: response.ok,
      test: {
        endpoint,
        method,
        status: response.ok ? 'PASSED' : 'FAILED',
        statusCode: response.status,
        responseTime,
        data: response.ok ? data : { error: data.error || 'Unknown error' }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}