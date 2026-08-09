// Data simulation service for real-time dashboard updates
class DataSimulationService {
  constructor() {
    this.subscribers = new Set();
    this.isRunning = false;
    this.intervalId = null;
    this.updateFrequency = 5000; // 5 seconds
    this.baseData = this.initializeBaseData();
  }

  initializeBaseData() {
    return {
      overview: {
        totalInvoices: 1250,
        totalRevenue: 2850000,
        totalCustomers: 342,
        pendingPayments: 165000,
        monthlyGrowth: 12.5,
        invoiceGrowth: 8.3,
        customerGrowth: 15.2,
        paymentGrowth: -3.1
      },
      recentActivity: [],
      alerts: [],
      systemHealth: {
        cpu: 45,
        memory: 62,
        disk: 78,
        network: 23
      }
    };
  }

  // Subscribe to real-time updates
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Start simulation if this is the first subscriber
    if (this.subscribers.size === 1 && !this.isRunning) {
      this.start();
    }

    // Send initial data
    callback({
      type: 'initial',
      data: this.baseData,
      timestamp: new Date().toISOString()
    });

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
      
      // Stop simulation if no subscribers
      if (this.subscribers.size === 0) {
        this.stop();
      }
    };
  }

  // Start the simulation
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Data simulation service started');
    
    this.intervalId = setInterval(() => {
      this.generateUpdate();
    }, this.updateFrequency);
  }

  // Stop the simulation
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('Data simulation service stopped');
  }

  // Generate a random update
  generateUpdate() {
    const updateType = this.getRandomUpdateType();
    const update = this.createUpdate(updateType);
    
    // Broadcast to all subscribers
    this.broadcast(update);
  }

  // Get random update type
  getRandomUpdateType() {
    const types = [
      'invoice_created',
      'payment_received',
      'customer_added',
      'system_alert',
      'performance_update',
      'revenue_milestone'
    ];
    
    return types[Math.floor(Math.random() * types.length)];
  }

  // Create update based on type
  createUpdate(type) {
    const timestamp = new Date().toISOString();
    
    switch (type) {
      case 'invoice_created':
        const newInvoice = this.generateNewInvoice();
        this.baseData.overview.totalInvoices += 1;
        this.baseData.overview.totalRevenue += newInvoice.amount;
        
        return {
          type: 'invoice_created',
          data: {
            invoice: newInvoice,
            overview: this.baseData.overview
          },
          message: `New invoice created: ${newInvoice.id}`,
          timestamp
        };

      case 'payment_received':
        const payment = this.generatePayment();
        this.baseData.overview.pendingPayments -= payment.amount;
        
        return {
          type: 'payment_received',
          data: {
            payment,
            overview: this.baseData.overview
          },
          message: `Payment received: ₹${payment.amount.toLocaleString()}`,
          timestamp
        };

      case 'customer_added':
        const newCustomer = this.generateNewCustomer();
        this.baseData.overview.totalCustomers += 1;
        
        return {
          type: 'customer_added',
          data: {
            customer: newCustomer,
            overview: this.baseData.overview
          },
          message: `New customer added: ${newCustomer.name}`,
          timestamp
        };

      case 'system_alert':
        const alert = this.generateSystemAlert();
        this.baseData.alerts.push(alert);
        
        return {
          type: 'system_alert',
          data: { alert },
          message: alert.message,
          timestamp
        };

      case 'performance_update':
        this.updateSystemHealth();
        
        return {
          type: 'performance_update',
          data: {
            systemHealth: this.baseData.systemHealth
          },
          message: 'System performance updated',
          timestamp
        };

      case 'revenue_milestone':
        const milestone = this.checkRevenueMilestone();
        
        if (milestone) {
          return {
            type: 'revenue_milestone',
            data: { milestone },
            message: `Revenue milestone reached: ₹${milestone.amount.toLocaleString()}`,
            timestamp
          };
        }
        
        // Fallback to performance update
        return this.createUpdate('performance_update');

      default:
        return {
          type: 'heartbeat',
          data: { status: 'active' },
          message: 'System heartbeat',
          timestamp
        };
    }
  }

  // Generate new invoice
  generateNewInvoice() {
    const customers = ['ABC Corp', 'XYZ Ltd', 'Tech Solutions', 'Global Inc'];
    const statuses = ['Draft', 'Sent', 'Pending'];
    
    return {
      id: `INV-${Date.now()}`,
      customer: customers[Math.floor(Math.random() * customers.length)],
      amount: 5000 + Math.floor(Math.random() * 45000),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
  }

  // Generate payment
  generatePayment() {
    return {
      id: `PAY-${Date.now()}`,
      invoiceId: `INV-${Date.now() - Math.floor(Math.random() * 1000000)}`,
      amount: 1000 + Math.floor(Math.random() * 20000),
      method: ['Bank Transfer', 'Credit Card', 'Check'][Math.floor(Math.random() * 3)],
      receivedAt: new Date().toISOString()
    };
  }

  // Generate new customer
  generateNewCustomer() {
    const companies = ['Innovative Solutions', 'Future Tech', 'Smart Systems', 'Digital Dynamics'];
    
    return {
      id: `CUST-${Date.now()}`,
      name: companies[Math.floor(Math.random() * companies.length)],
      industry: ['Technology', 'Manufacturing', 'Services', 'Retail'][Math.floor(Math.random() * 4)],
      joinedAt: new Date().toISOString()
    };
  }

  // Generate system alert
  generateSystemAlert() {
    const alerts = [
      { level: 'info', message: 'System backup completed successfully' },
      { level: 'warning', message: 'High memory usage detected' },
      { level: 'info', message: 'New user registration' },
      { level: 'warning', message: 'API rate limit approaching' },
      { level: 'success', message: 'Database optimization completed' }
    ];
    
    const alert = alerts[Math.floor(Math.random() * alerts.length)];
    
    return {
      id: `ALERT-${Date.now()}`,
      ...alert,
      timestamp: new Date().toISOString()
    };
  }

  // Update system health metrics
  updateSystemHealth() {
    this.baseData.systemHealth = {
      cpu: Math.max(0, Math.min(100, this.baseData.systemHealth.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(0, Math.min(100, this.baseData.systemHealth.memory + (Math.random() - 0.5) * 8)),
      disk: Math.max(0, Math.min(100, this.baseData.systemHealth.disk + (Math.random() - 0.5) * 5)),
      network: Math.max(0, Math.min(100, this.baseData.systemHealth.network + (Math.random() - 0.5) * 15))
    };
  }

  // Check for revenue milestones
  checkRevenueMilestone() {
    const milestones = [3000000, 3500000, 4000000, 5000000];
    const currentRevenue = this.baseData.overview.totalRevenue;
    
    for (const milestone of milestones) {
      if (currentRevenue >= milestone && currentRevenue - 50000 < milestone) {
        return {
          amount: milestone,
          achieved: true,
          progress: (currentRevenue / milestone) * 100
        };
      }
    }
    
    return null;
  }

  // Broadcast update to all subscribers
  broadcast(update) {
    this.subscribers.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error broadcasting update:', error);
      }
    });
  }

  // Get current data snapshot
  getCurrentData() {
    return {
      ...this.baseData,
      timestamp: new Date().toISOString()
    };
  }

  // Manually trigger specific update
  triggerUpdate(type, data = {}) {
    const update = {
      type,
      data,
      timestamp: new Date().toISOString(),
      manual: true
    };
    
    this.broadcast(update);
  }

  // Set update frequency
  setUpdateFrequency(frequency) {
    this.updateFrequency = frequency;
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      subscriberCount: this.subscribers.size,
      updateFrequency: this.updateFrequency,
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }
}

// Create singleton instance
const dataSimulationService = new DataSimulationService();

export default dataSimulationService;