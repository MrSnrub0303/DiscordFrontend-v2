import React, { useEffect, useState, createContext, useRef } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import { DISCORD_CLIENT_ID } from './config';

export const ActivityContext = createContext(null);

export function ActivityProvider({ children }) {
  const [sdk, setSdk] = useState(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);
  const [initializationStep, setInitializationStep] = useState('starting');
  const [debugLogs, setDebugLogs] = useState([]);
  const initializationRef = useRef(false);

  // Add debug log function
  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-4), `[${timestamp}] ${message}`]);
    console.log(message);
  };

  // Debug logging
  console.log('ActivityProvider state:', { 
    sdkInitialized: !!sdk, 
    error, 
    ready, 
    hasToken: !!token,
    step: initializationStep
  });

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setInitializationStep('creating_sdk');
        addDebugLog('Initializing Discord SDK...');
        
        // Check if we're running in Discord
        if (typeof window === 'undefined') {
          throw new Error('Running in non-browser environment');
        }

        // Verify Discord client ID
        if (!DISCORD_CLIENT_ID) {
          throw new Error('DISCORD_CLIENT_ID is not defined in config');
        }

        addDebugLog(`Using Discord Client ID: ${DISCORD_CLIENT_ID}`);
        
        // Create SDK instance
        setInitializationStep('sdk_instance');
        const discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
        addDebugLog('SDK instance created');
        
        // Set SDK immediately so we can show progress
        setSdk(discordSdk);
        
        // Wait for SDK to be ready with timeout
        setInitializationStep('waiting_ready');
        addDebugLog('Waiting for SDK to be ready...');
        
        const readyPromise = discordSdk.ready();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SDK ready timeout after 15 seconds')), 15000)
        );
        
        await Promise.race([readyPromise, timeoutPromise]);
        addDebugLog('SDK is ready');
        
        // Add a small delay to ensure Discord is fully ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setInitializationStep('authorizing');
        addDebugLog('Starting authorization...');
        
        // Get authentication token using Activity flow (no redirect URI needed)
        const authResult = await discordSdk.commands.authorize({
          client_id: DISCORD_CLIENT_ID,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: ['identify', 'guilds', 'applications.commands'],
        });
        
        addDebugLog(`Authorization successful, got code: ${authResult.code?.substring(0, 10)}...`);

        if (!authResult.code) {
          throw new Error('No authorization code received');
        }

        setInitializationStep('exchanging_token');
        addDebugLog('Exchanging code for token...');
        addDebugLog(`Making request to /api/token (via Discord proxy)`);
        
        // Use relative URL - Discord will proxy to your mapped backend
        const response = await fetch('/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: authResult.code }),
        });

        addDebugLog(`Token exchange response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          addDebugLog(`Token exchange failed: ${response.status} - ${errorText}`);
          throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
        }

        const tokenData = await response.json();
        addDebugLog(`Token exchange successful, got access_token: ${tokenData.access_token ? 'YES' : 'NO'}`);
        
        if (!tokenData.access_token) {
          addDebugLog(`No access token in response: ${JSON.stringify(tokenData)}`);
          throw new Error('No access token received from server');
        }

        addDebugLog('Token exchange successful');
        
        setInitializationStep('authenticating');
        addDebugLog('Authenticating with Discord...');
        
        // Authenticate with Discord using the access token
        const authResponse = await discordSdk.commands.authenticate({
          access_token: tokenData.access_token,
        });
        
        addDebugLog(`Authentication successful: ${authResponse ? 'YES' : 'NO'}`);
        
        // Store authenticated user info in the SDK for later use
        discordSdk.authenticated = authResponse;
        
        setToken(tokenData.access_token);
        setInitializationStep('complete');
        setReady(true);
        
        addDebugLog('Discord Activity fully initialized and ready!');
        
      } catch (error) {
        addDebugLog(`ERROR: ${error.message}`);
        console.error('Error initializing Discord SDK:', error);
        
        // Enhanced error details
        let errorDetails = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          location: 'SDK Initialization',
          step: initializationStep,
          time: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        
        console.log('Detailed error information:', errorDetails);
        
        // Check for specific error types
        if (error.name === 'ActivityRejectedError') {
          console.log('Activity was rejected by Discord');
          errorDetails.suggestion = 'Make sure your activity is approved and running in Discord';
        } else if (error.name === 'AuthorizationError') {
          console.log('Authorization failed - check client ID and scopes');
          errorDetails.suggestion = 'Verify your Discord Client ID and application settings';
        } else if (error.code === 4002 || error.message.includes('Already authing')) {
          console.log('Multiple authentication attempts detected');
          errorDetails.suggestion = 'Another authentication is in progress. Please wait or refresh the activity.';
          // Reset initialization flag to allow retry after a delay
          setTimeout(() => {
            initializationRef.current = false;
          }, 3000);
        } else if (error.message.includes('timeout')) {
          errorDetails.suggestion = 'Discord SDK took too long to initialize. Try refreshing the activity.';
        } else if (error.message.includes('DISCORD_CLIENT_ID')) {
          errorDetails.suggestion = 'Check your config file and ensure DISCORD_CLIENT_ID is properly set';
        } else if (error.message.includes('Token exchange failed')) {
          errorDetails.suggestion = 'Check that your backend server is running and accessible at https://discordbackend-xggi.onrender.com';
        } else if (error.message.includes('fetch')) {
          errorDetails.suggestion = 'Network error - check your proxy settings and backend server';
        } else if (error.message.includes('authenticate')) {
          errorDetails.suggestion = 'Authentication failed - the access token may be invalid';
        } else if (error.message.includes('already running')) {
          errorDetails.suggestion = 'Another instance is already running. Try closing and reopening the activity.';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorDetails.suggestion = 'Cannot reach backend server. Check if your servers are running and accessible.';
        }
        
        setError(errorDetails);
      }
    };

    // Only initialize once, even with StrictMode
    if (initializationRef.current) {
      addDebugLog('Already initialized, skipping...');
      return;
    }
    
    initializationRef.current = true;
    addDebugLog('Starting initialization...');
    
    initializeSDK().catch((err) => {
      console.error('SDK initialization failed:', err);
      initializationRef.current = false; // Reset on error to allow retry
    });

    // Cleanup
    return () => {
      if (sdk) {
        // Perform any necessary cleanup
        console.log('Cleaning up Discord SDK');
      }
    };
  }, []); // Empty dependency array to run only once

  // Handle activity lifecycle events (simplified without invalid event listeners)
  useEffect(() => {
    if (!sdk || !ready) return;

    const handleStart = async () => {
      try {
        addDebugLog('Activity lifecycle: starting...');
        // Basic activity initialization without invalid event listeners
      } catch (err) {
        console.error('Error during activity start:', err);
      }
    };

    handleStart();
  }, [sdk, ready]);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        color: '#dc3545', 
        background: '#f8f9fa', 
        border: '1px solid #dc3545',
        borderRadius: '4px',
        margin: '20px',
        fontFamily: 'monospace'
      }}>
        <h3>Discord Activity Error</h3>
        <p><strong>Step:</strong> {error.step}</p>
        <p><strong>Error:</strong> {error.message}</p>
        {error.suggestion && (
          <p><strong>Suggestion:</strong> {error.suggestion}</p>
        )}
        <details>
          <summary>Debug Information</summary>
          <pre style={{ fontSize: '12px', marginTop: '10px', overflow: 'auto' }}>
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ 
        padding: '20px', 
        color: '#495057', 
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        margin: '20px',
        textAlign: 'center'
      }}>
        <h3>Loading Discord Activity...</h3>
        <div style={{ 
          width: '100%', 
          height: '4px', 
          background: '#e9ecef', 
          borderRadius: '2px', 
          margin: '20px 0',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: '#007bff',
            borderRadius: '2px',
            animation: 'loading 2s infinite ease-in-out',
            width: '30%'
          }} />
        </div>
        <div style={{ fontSize: '14px', marginTop: '10px' }}>
          <strong>Status:</strong> {initializationStep.replace('_', ' ').toUpperCase()}
        </div>
        <div style={{ fontSize: '12px', marginTop: '5px', color: '#6c757d' }}>
          SDK: {sdk ? 'Initialized' : 'Not Initialized'} | 
          Ready: {ready ? 'Yes' : 'No'} | 
          Token: {token ? 'Yes' : 'No'}
        </div>
        
        {/* Debug logs */}
        <div style={{ 
          marginTop: '15px', 
          textAlign: 'left', 
          background: '#ffffff', 
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '10px',
          maxHeight: '200px',
          overflow: 'auto',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Debug Log:</div>
          {debugLogs.length === 0 ? (
            <div style={{ color: '#6c757d' }}>No logs yet...</div>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>{log}</div>
            ))
          )}
        </div>
        
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(200%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <ActivityContext.Provider value={{ sdk, token, ready }}>
      {children}
    </ActivityContext.Provider>
  );
}