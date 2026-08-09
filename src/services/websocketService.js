class WebSocketService {
  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  // Connect to a WebSocket endpoint
  connect(endpoint, options = {}) {
    const {
      onMessage,
      onOpen,
      onClose,
      onError,
      autoReconnect = true,
      maxReconnectAttempts = this.maxReconnectAttempts
    } = options;

    if (this.connections.has(endpoint)) {
      const existingConnection = this.connections.get(endpoint);
      if (existingConnection.readyState === WebSocket.OPEN) {
        console.log(`WebSocket already connected to ${endpoint}`);
        return existingConnection;
      }
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}${endpoint}`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = (event) => {
        console.log(`WebSocket connected to ${endpoint}`);
        this.reconnectAttempts.set(endpoint, 0);
        if (onOpen) onOpen(event);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (error) {
          console.error(`Error parsing WebSocket message from ${endpoint}:`, error);
          if (onMessage) onMessage(event.data);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected from ${endpoint}:`, event.code, event.reason);
        this.connections.delete(endpoint);
        
        if (onClose) onClose(event);

        // Auto-reconnect logic
        if (autoReconnect && event.code !== 1000) { // 1000 = normal closure
          const attempts = this.reconnectAttempts.get(endpoint) || 0;
          if (attempts < maxReconnectAttempts) {
            const delay = this.reconnectDelay * Math.pow(2, attempts);
            console.log(`Attempting to reconnect to ${endpoint} in ${delay}ms (attempt ${attempts + 1}/${maxReconnectAttempts})`);
            
            setTimeout(() => {
              this.reconnectAttempts.set(endpoint, attempts + 1);
              this.connect(endpoint, options);
            }, delay);
          } else {
            console.error(`Max reconnection attempts reached for ${endpoint}`);
            this.reconnectAttempts.delete(endpoint);
          }
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error on ${endpoint}:`, error);
        if (onError) onError(error);
      };

      this.connections.set(endpoint, ws);
      return ws;
    } catch (error) {
      console.error(`Error creating WebSocket connection to ${endpoint}:`, error);
      if (onError) onError(error);
      return null;
    }
  }

  // Send message to a specific endpoint
  send(endpoint, data) {
    const connection = this.connections.get(endpoint);
    if (connection && connection.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      connection.send(message);
      return true;
    } else {
      console.warn(`WebSocket connection to ${endpoint} is not open`);
      return false;
    }
  }

  // Disconnect from a specific endpoint
  disconnect(endpoint) {
    const connection = this.connections.get(endpoint);
    if (connection) {
      connection.close(1000, 'Manual disconnect');
      this.connections.delete(endpoint);
      this.reconnectAttempts.delete(endpoint);
    }
  }

  // Disconnect from all endpoints
  disconnectAll() {
    this.connections.forEach((connection, endpoint) => {
      connection.close(1000, 'Manual disconnect all');
    });
    this.connections.clear();
    this.reconnectAttempts.clear();
  }

  // Get connection status
  getConnectionStatus(endpoint) {
    const connection = this.connections.get(endpoint);
    if (!connection) return 'disconnected';
    
    switch (connection.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  // Check if connected to endpoint
  isConnected(endpoint) {
    return this.getConnectionStatus(endpoint) === 'connected';
  }

  // Get all active connections
  getActiveConnections() {
    const active = [];
    this.connections.forEach((connection, endpoint) => {
      if (connection.readyState === WebSocket.OPEN) {
        active.push(endpoint);
      }
    });
    return active;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

// Dashboard-specific WebSocket manager
export class DashboardWebSocketManager {
  constructor() {
    this.endpoint = '/api/ws/dashboard';
    this.subscribers = new Set();
    this.isInitialized = false;
  }

  // Initialize dashboard WebSocket connection
  initialize() {
    if (this.isInitialized) return;

    websocketService.connect(this.endpoint, {
      onMessage: (data) => {
        this.notifySubscribers(data);
      },
      onOpen: () => {
        console.log('Dashboard WebSocket initialized');
        this.notifySubscribers({ type: 'connection', status: 'connected' });
      },
      onClose: () => {
        console.log('Dashboard WebSocket closed');
        this.notifySubscribers({ type: 'connection', status: 'disconnected' });
      },
      onError: (error) => {
        console.error('Dashboard WebSocket error:', error);
        this.notifySubscribers({ type: 'error', error: error.message });
      },
      autoReconnect: true,
      maxReconnectAttempts: 5
    });

    this.isInitialized = true;
  }

  // Subscribe to dashboard updates
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Initialize connection if not already done
    if (!this.isInitialized) {
      this.initialize();
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
      
      // Clean up connection if no subscribers
      if (this.subscribers.size === 0) {
        this.cleanup();
      }
    };
  }

  // Notify all subscribers
  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in dashboard WebSocket subscriber:', error);
      }
    });
  }

  // Send message to dashboard WebSocket
  send(data) {
    return websocketService.send(this.endpoint, data);
  }

  // Check connection status
  isConnected() {
    return websocketService.isConnected(this.endpoint);
  }

  // Cleanup
  cleanup() {
    websocketService.disconnect(this.endpoint);
    this.isInitialized = false;
    this.subscribers.clear();
  }
}

// Create singleton dashboard WebSocket manager
export const dashboardWebSocket = new DashboardWebSocketManager();

export default websocketService;