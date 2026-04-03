import React from 'react';
import { ActivityContext } from './ActivityContext';

export { ActivityContext };

export function ActivityProvider({ children }) {
  
  const mockSdk = {
    instanceId: 'mock-instance-' + Math.random().toString(36).substr(2, 9),
    channelId: 'mock-channel-' + Math.random().toString(36).substr(2, 9),
    commands: {
      setActivity: () => Promise.resolve(),
      getInstanceConnectedParticipants: () => Promise.resolve({
        participants: [{
          user: {
            id: 'mock-user-' + Math.random().toString(36).substr(2, 9),
            username: 'TestUser',
            discriminator: '0000',
            avatar: null,
            global_name: 'Test User'
          }
        }]
      }),
      getChannel: (params) => Promise.resolve({
        id: params.channel_id,
        name: 'Voice Channel'
      }),
      subscribe: () => Promise.resolve(),
      authorize: () => Promise.resolve({ code: 'mock-code' }),
      authenticate: () => Promise.resolve({ access_token: 'mock-token' })
    },
    authenticated: {
      user: {
        id: 'mock-user-' + Math.random().toString(36).substr(2, 9),
        username: 'TestUser',
        discriminator: '0000',
        avatar: null,
        global_name: 'Test User'
      }
    }
  };

  const mockToken = 'mock-token-' + Math.random().toString(36).substr(2, 9);

  return (
    <ActivityContext.Provider value={{ 
      sdk: mockSdk, 
      token: mockToken, 
      ready: true,
      error: null,
      initializationStep: 'complete',
      debugLogs: [],
      addDebugLog: () => {}
    }}>
      {children}
    </ActivityContext.Provider>
  );
}
