"use client";

// WebSocket service for real-time dashboard updates
// Note: This is a mock implementation since Next.js doesn't support WebSocket upgrades
// in API routes without a custom server. For production, consider using Socket.IO with a custom server.

type WebSocketMessage = {
  type: 'connection' | 'notification' | 'update' | 'error';
  status?: 'connected' | 'disconnected';
  data?: any;
  message?: string;
  timestamp?: string;
};

type WebSocketSubscriber = (message: WebSocketMessage) => void;

class DashboardWebSocket {
  private subscribers: WebSocketSubscriber[] = [];
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private ws: WebSocket | null = null;

  constructor() {
    // Initialize with mock connection for demo purposes
    this.simulateConnection();
  }

  // Simulate WebSocket connection for demo
  private simulateConnection() {
    setTimeout(() => {
      this.connected = true;
      this.notifySubscribers({
        type: 'connection',
        status: 'connected',
        timestamp: new Date().toISOString()
      });

      // Simulate periodic updates
      this.startMockUpdates();
    }, 1000);
  }

  private startMockUpdates() {
    // Simulate real-time notifications every 30 seconds
    setInterval(() => {
      if (this.connected) {
        const notifications = [
          { type: 'notification', data: { title: 'New Invoice', message: 'Invoice #INV-001 created', severity: 'info' }},
          { type: 'notification', data: { title: 'Payment Received', message: 'Payment of ₹50,000 received', severity: 'success' }},
          { type: 'notification', data: { title: 'Overdue Invoice', message: 'Invoice #INV-002 is overdue', severity: 'warning' }},
          { type: 'update', data: { type: 'dashboard', action: 'refresh' }}
        ];

        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        this.notifySubscribers({
          ...randomNotification,
          timestamp: new Date().toISOString()
        } as WebSocketMessage);
      }
    }, 30000);
  }

  connect(url?: string) {
    if (this.connected) return;

    try {
      // In a real implementation, you would connect to a WebSocket server
      // this.ws = new WebSocket(url || 'ws://localhost:3001/dashboard');
      
      // For now, just simulate connection
      this.simulateConnection();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.notifySubscribers({
      type: 'connection',
      status: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }

  subscribe(callback: WebSocketSubscriber) {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  send(message: any) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
    }
  }

  private notifySubscribers(message: WebSocketMessage) {
    this.subscribers.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in WebSocket subscriber:', error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifySubscribers({
        type: 'error',
        message: 'Failed to establish WebSocket connection after multiple attempts',
        timestamp: new Date().toISOString()
      });
    }
  }

  isConnected() {
    return this.connected;
  }

  getConnectionStatus() {
    return {
      connected: this.connected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Export singleton instance
export const dashboardWebSocket = new DashboardWebSocket();

// Real-time data simulation service
export class RealtimeDataSimulator {
  private static instance: RealtimeDataSimulator;
  private intervals: NodeJS.Timeout[] = [];

  static getInstance() {
    if (!RealtimeDataSimulator.instance) {
      RealtimeDataSimulator.instance = new RealtimeDataSimulator();
    }
    return RealtimeDataSimulator.instance;
  }

  startSimulation() {
    // Simulate invoice updates every 45 seconds
    const invoiceInterval = setInterval(() => {
      dashboardWebSocket.send({
        type: 'data_update',
        entity: 'invoices',
        action: 'create',
        data: {
          id: `INV-${Date.now()}`,
          amount: Math.floor(Math.random() * 100000) + 10000,
          customer: `Customer ${Math.floor(Math.random() * 100)}`,
          status: 'Pending'
        }
      });
    }, 45000);

    // Simulate payment updates every 60 seconds
    const paymentInterval = setInterval(() => {
      dashboardWebSocket.send({
        type: 'data_update',
        entity: 'payments',
        action: 'update',
        data: {
          amount: Math.floor(Math.random() * 50000) + 5000,
          status: 'Paid'
        }
      });
    }, 60000);

    // Simulate customer updates every 2 minutes
    const customerInterval = setInterval(() => {
      dashboardWebSocket.send({
        type: 'data_update',
        entity: 'customers',
        action: 'create',
        data: {
          name: `New Customer ${Date.now()}`,
          totalSpent: Math.floor(Math.random() * 200000) + 50000
        }
      });
    }, 120000);

    this.intervals = [invoiceInterval, paymentInterval, customerInterval];
  }

  stopSimulation() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }
}

// Auto-start simulation in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const simulator = RealtimeDataSimulator.getInstance();
  simulator.startSimulation();
}

export default dashboardWebSocket;