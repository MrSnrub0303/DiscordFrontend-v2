import React, { createContext } from 'react';

export const ActivityContext = createContext(null);

export function ActivityProvider({ children }) {
  
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
