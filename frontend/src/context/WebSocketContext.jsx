/**
 * React Context and Provider for application-level WebSocket integration.
 * Connects when user is authenticated, disconnects on logout.
 */

import React, { createContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import websocketService from '../services/websocketService';

export const WebSocketContext = createContext({
  status: 'offline', // 'connected' | 'connecting' | 'offline'
  isConnected: false,
  subscribe: () => () => {},
  subscribeAll: () => () => {},
});

export function WebSocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState(websocketService.status);

  useEffect(() => {
    const unsub = websocketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      websocketService.connect();
    } else {
      websocketService.disconnect();
    }
  }, [isAuthenticated, user]);

  const value = useMemo(
    () => ({
      status,
      isConnected: status === 'connected',
      subscribe: (eventType, cb) => websocketService.subscribe(eventType, cb),
      subscribeAll: (cb) => websocketService.subscribeAll(cb),
    }),
    [status]
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export default WebSocketProvider;
