// src/hooks/useErrorRecovery.js
import { useCallback, useEffect, useRef } from 'react';
import { socket } from '../socket';

const RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_ATTEMPTS = 5;

export function useErrorRecovery(voiceChannel, currentUser, isConnected) {
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (!voiceChannel?.id || !currentUser?.accessToken) {
      console.error('Missing required data for reconnection');
      return;
    }

    // Increment attempt counter
    reconnectAttemptsRef.current++;

    // Configure socket with reconnection flag
    socket.auth = {
      token: currentUser.accessToken,
      channelId: voiceChannel.id,
      reconnecting: true
    };

    // Attempt to reconnect
    socket.connect();
  }, [voiceChannel, currentUser]);

  // Handle disconnection
  useEffect(() => {
    if (!isConnected && voiceChannel && currentUser) {
      console.log('Connection lost, scheduling reconnect attempt...');
      
      // Clear any existing timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Schedule reconnection attempt
      reconnectTimeoutRef.current = setTimeout(() => {
        attemptReconnect();
      }, RECONNECT_DELAY);
    }

    // Reset attempts when successfully connected
    if (isConnected) {
      reconnectAttemptsRef.current = 0;
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isConnected, voiceChannel, currentUser, attemptReconnect]);

  // Handle socket errors
  useEffect(() => {
    const handleError = (error) => {
      console.error('Socket error:', error);
      // Could dispatch to error tracking service here
    };

    const handleReconnectFailed = () => {
      console.error('Reconnection failed');
      // Could show UI error message here
    };

    socket.on('error', handleError);
    socket.on('reconnect_failed', handleReconnectFailed);

    return () => {
      socket.off('error', handleError);
      socket.off('reconnect_failed', handleReconnectFailed);
    };
  }, []);

  return {
    reconnectAttempts: reconnectAttemptsRef.current,
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
  };
}
