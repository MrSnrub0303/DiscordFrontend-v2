import React, { createContext } from 'react';

export const ActivityContext = createContext(null);

export function ActivityProvider({ children }) {
  // Skip Discord OAuth for now and use a mock context
  const mockSdk = {
    commands: {
      setActivity: () => Promise.resolve(),
    },
    authenticated: {
      user: {
        id: 'mock-user-' + Math.random().toString(36).substr(2, 9),
        username: 'TestUser',
        discriminator: '0000'
      }
    }
  };

  const mockToken = 'mock-token';

  // console.log('🎮 Using mock Discord SDK (OAuth bypassed)');

  return (
    <ActivityContext.Provider value={{ 
      sdk: mockSdk, 
      token: mockToken, 
      ready: true 
    }}>
      {children}
    </ActivityContext.Provider>
  );
}
