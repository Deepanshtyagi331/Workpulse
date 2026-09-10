/**
 * Centralized WebSocket client service for WorkPulse.
 * Connects to ws://{host}/api/ws?token={jwt} with auto-reconnect backoff.
 * Dispatches parsed JSON events to registered subscribers.
 */

import authService from './authService';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.status = 'offline'; // 'connected' | 'connecting' | 'offline'
    this.subscribers = new Map(); // eventType -> Set of callbacks
    this.allSubscribers = new Set(); // Set of callbacks listening to all events
    this.statusListeners = new Set(); // Set of callbacks listening to status changes

    this.reconnectTimer = null;
    this.reconnectAttempt = 0;
    this.maxReconnectDelay = 15000;
    this.baseDelay = 1000;
    this.manualClose = false;
    this.pingTimer = null;
  }

  /**
   * Determine WebSocket URL based on current origin.
   */
  getWsUrl() {
    const token = authService.getToken();
    if (!token) return null;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use host directly, or backend port 8000 during local dev if on 5173
    let host = window.location.host;
    if (host.includes(':5173')) {
      host = host.replace(':5173', ':8000');
    }
    return `${protocol}//${host}/api/ws?token=${encodeURIComponent(token)}`;
  }

  /**
   * Set connection status and notify listeners.
   */
  setStatus(newStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach((cb) => {
      try {
        cb(newStatus);
      } catch (err) {
        console.error('[WS] Error in status callback:', err);
      }
    });
  }

  /**
   * Open WebSocket connection.
   */
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const url = this.getWsUrl();
    if (!url) {
      this.setStatus('offline');
      return;
    }

    this.manualClose = false;
    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.setStatus('connected');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        if (event.data === 'pong') return;

        try {
          const parsed = JSON.parse(event.data);
          this.dispatchEvent(parsed);
        } catch (e) {
          // Ignore non-JSON raw strings
        }
      };

      this.ws.onerror = (error) => {
        // Suppress noisy error logging during disconnects; onclose will handle reconnect
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.ws = null;
        this.setStatus('offline');

        if (!this.manualClose && authService.isAuthenticated()) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      this.setStatus('offline');
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule exponential backoff reconnect.
   */
  scheduleReconnect() {
    if (this.reconnectTimer) return;

    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempt),
      this.maxReconnectDelay
    );
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (authService.isAuthenticated()) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Disconnect cleanly (e.g. on user logout).
   */
  disconnect() {
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'User logged out');
      this.ws = null;
    }
    this.setStatus('offline');
    this.reconnectAttempt = 0;
  }

  /**
   * Heartbeat to keep connection alive across proxies.
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 25000);
  }

  stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Subscribe to specific event types (e.g. 'task.updated').
   * Returns an unsubscribe function.
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(callback);

    return () => {
      const set = this.subscribers.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.subscribers.delete(eventType);
      }
    };
  }

  /**
   * Subscribe to all events.
   */
  subscribeAll(callback) {
    this.allSubscribers.add(callback);
    return () => this.allSubscribers.delete(callback);
  }

  /**
   * Listen for connection status changes ('connected' | 'connecting' | 'offline').
   */
  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  /**
   * Internal event dispatcher.
   */
  dispatchEvent(event) {
    if (!event || !event.type) return;

    // Specific subscribers
    const handlers = this.subscribers.get(event.type);
    if (handlers) {
      handlers.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[WS] Error in subscriber for ${event.type}:`, err);
        }
      });
    }

    // Wildcard subscribers
    this.allSubscribers.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('[WS] Error in wildcard subscriber:', err);
      }
    });
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
