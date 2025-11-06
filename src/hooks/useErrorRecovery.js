
import { useCallback, useEffect, useRef } from 'react';
import { socket } from '../socket';

const RECONNECT_DELAY = 1000; 
const MAX_RECONNECT_ATTEMPTS = 5;

export function useErrorRecovery(voiceChannel, currentUser, isConnected) {
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      
      return;
    }

    if (!voiceChannel?.id || !currentUser?.accessToken) {
      
      return;
    }

    
    reconnectAttemptsRef.current++;

    
    socket.auth = {
      token: currentUser.accessToken,
      channelId: voiceChannel.id,
      reconnecting: true
    };

    
    socket.connect();
  }, [voiceChannel, currentUser]);

  
  useEffect(() => {
    if (!isConnected && voiceChannel && currentUser) {
      
      
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      
      reconnectTimeoutRef.current = setTimeout(() => {
        attemptReconnect();
      }, RECONNECT_DELAY);
    }

    
    if (isConnected) {
      reconnectAttemptsRef.current = 0;
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isConnected, voiceChannel, currentUser, attemptReconnect]);

  
  useEffect(() => {
    const handleError = (error) => {
      
      
    };

    const handleReconnectFailed = () => {
      
      
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
