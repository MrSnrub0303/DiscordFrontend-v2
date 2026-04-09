import React, { useEffect, useState, useRef } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import { DISCORD_CLIENT_ID } from './config';
import { ActivityContext } from './ActivityContext';
import loadingSpinner from '../assets/loadingspinner.png';
import ServerLoadingBackground from '../assets/ServerLoadingBackground.png';

export { ActivityContext };

// Module-level flag to prevent duplicate SDK initialization across component remounts
let globalInitializationStarted = false;
let globalSdkInstance = null;
let globalAuthResult = null;

export function ActivityProvider({ children }) {
  const [sdk, setSdk] = useState(globalSdkInstance);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(!!globalAuthResult);
  const [token, setToken] = useState(globalAuthResult?.access_token || null);
  const [initializationStep, setInitializationStep] = useState(globalInitializationStarted ? 'already_started' : 'starting');
  const [debugLogs, setDebugLogs] = useState([]);
  const initializationRef = useRef(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(!globalAuthResult);
  const [loadingFadingOut, setLoadingFadingOut] = useState(false);

  
  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-4), `[${timestamp}] ${message}`]);
    
  };

  
  
    
    
    
    
    
  

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setInitializationStep('creating_sdk');
        addDebugLog('Initializing Discord SDK...');
        
        
        if (typeof window === 'undefined') {
          throw new Error('Running in non-browser environment');
        }

        
        if (!DISCORD_CLIENT_ID) {
          throw new Error('DISCORD_CLIENT_ID is not defined in config');
        }

        addDebugLog(`Using Discord Client ID: ${DISCORD_CLIENT_ID}`);
        
        
        setInitializationStep('sdk_instance');
        const discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
        addDebugLog('SDK instance created');
        
        
        setSdk(discordSdk);
        
        
        setInitializationStep('waiting_ready');
        const ticketPresent = new URLSearchParams(window.location.search).has('discord_proxy_ticket');
        addDebugLog(`Waiting for SDK to be ready (ticket present: ${ticketPresent})...`);

        const readyPromise = discordSdk.ready();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(
            () => reject(new Error('SDK ready timeout after 30 seconds')),
            30000,
          )
        );

        await Promise.race([readyPromise, timeoutPromise]);
        addDebugLog('SDK is ready');
        
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setInitializationStep('authorizing');
        addDebugLog('Starting authorization...');
        
        
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
        
        
        const authResponse = await discordSdk.commands.authenticate({
          access_token: tokenData.access_token,
        });
        
        addDebugLog(`Authentication successful: ${authResponse ? 'YES' : 'NO'}`);
        
        
        discordSdk.authenticated = authResponse;
        
        // Store in global variables for reuse on remount
        globalSdkInstance = discordSdk;
        globalAuthResult = { access_token: tokenData.access_token, authResponse };
        
        setToken(tokenData.access_token);
        setInitializationStep('complete');
        setReady(true);
        
        addDebugLog('Discord Activity fully initialized and ready!');
        
      } catch (error) {
        addDebugLog(`ERROR: ${error.message}`);
        
        
        
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
        
        
        
        
        if (error.name === 'ActivityRejectedError') {
          
          errorDetails.suggestion = 'Make sure your activity is approved and running in Discord';
        } else if (error.name === 'AuthorizationError') {
          
          errorDetails.suggestion = 'Verify your Discord Client ID and application settings';
        } else if (error.code === 4002 || error.message.includes('Already authing')) {
          
          errorDetails.suggestion = 'Another authentication is in progress. Please wait or refresh the activity.';
          
          setTimeout(() => {
            initializationRef.current = false;
          }, 3000);
        } else if (error.message.includes('timeout')) {
          errorDetails.suggestion = 'Discord SDK took too long to initialize. Try refreshing the activity.';
        } else if (error.message.includes('DISCORD_CLIENT_ID')) {
          errorDetails.suggestion = 'Check your config file and ensure DISCORD_CLIENT_ID is properly set';
        } else if (error.message.includes('Token exchange failed')) {
          if (error.message.includes('500')) {
            errorDetails.message = 'Unstable Network - Server Error';
            errorDetails.suggestion = 'The backend server encountered an error. This might be due to network issues or server configuration. Please try again.';
          } else if (error.message.includes('503') || error.message.includes('502')) {
            errorDetails.message = 'Unstable Network - Service Unavailable';
            errorDetails.suggestion = 'The server is temporarily unavailable. Please wait a moment and try again.';
          } else {
            errorDetails.message = 'Unstable Network';
            errorDetails.suggestion = 'Check that your backend server is running and accessible at https://discordbackend-v2.onrender.com';
          }
        } else if (error.message.includes('fetch')) {
          errorDetails.message = 'Unstable Network';
          errorDetails.suggestion = 'Network connection issue - please check your internet connection and try again.';
        } else if (error.message.includes('authenticate')) {
          errorDetails.suggestion = 'Authentication failed - the access token may be invalid';
        } else if (error.message.includes('already running')) {
          errorDetails.suggestion = 'Another instance is already running. Try closing and reopening the activity.';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorDetails.message = 'Unstable Network';
          errorDetails.suggestion = 'Cannot reach backend server. Please check your internet connection.';
        }
        
        setError(errorDetails);
      }
    };

    // Check global flag first (prevents duplicate initialization across remounts)
    if (globalInitializationStarted) {
      addDebugLog('Global initialization already started, skipping...');
      // If we already have a result, use it
      if (globalSdkInstance && globalAuthResult) {
        setSdk(globalSdkInstance);
        setToken(globalAuthResult.access_token);
        setReady(true);
        setInitializationStep('complete');
      }
      return;
    }
    
    // Also check component ref (for within same mount)
    if (initializationRef.current) {
      addDebugLog('Already initialized in this mount, skipping...');
      return;
    }
    
    // Set both flags
    globalInitializationStarted = true;
    initializationRef.current = true;
    addDebugLog('Starting initialization...');
    
    initializeSDK().catch((err) => {
      // Only reset component ref, not global (to prevent infinite retry loops)
      initializationRef.current = false; 
    });

    
    return () => {
      if (sdk) {
        
        
      }
    };
  }, []); 

  
  useEffect(() => {
    if (!sdk || !ready) return;

    const handleStart = async () => {
      try {
        addDebugLog('Activity lifecycle: starting...');
        
      } catch (err) {
        
      }
    };

    handleStart();
  }, [sdk, ready]);

  // Map initialization steps to user-friendly messages and progress
  const getLoadingInfo = () => {
    const steps = {
      'starting': { message: 'Starting...', progress: 5 },
      'already_started': { message: 'Connecting...', progress: 10 },
      'creating_sdk': { message: 'Initializing...', progress: 15 },
      'sdk_instance': { message: 'Setting up...', progress: 25 },
      'waiting_ready': { message: 'Connecting to Discord...', progress: 35 },
      'authorizing': { message: 'Authorizing...', progress: 50 },
      'exchanging_token': { message: 'Connecting to server...', progress: 70 },
      'authenticating': { message: 'Almost there...', progress: 90 },
      'complete': { message: 'Ready!', progress: 100 },
    };
    return steps[initializationStep] || { message: 'Loading...', progress: 0 };
  };

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

  useEffect(() => {
    if (ready && showLoadingOverlay && !loadingFadingOut) {
      setLoadingFadingOut(true);
      const timer = setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [ready, showLoadingOverlay, loadingFadingOut]);

  const { message } = getLoadingInfo();

  return (
    <ActivityContext.Provider value={{ sdk, token, ready }}>
      {ready && children}
      {showLoadingOverlay && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          overflow: 'hidden',
          fontFamily: '"Trajan Pro Bold", serif',
          color: '#ffffff',
          opacity: loadingFadingOut ? 0 : 1,
          transition: 'opacity 0.6s ease',
          pointerEvents: loadingFadingOut ? 'none' : 'auto',
        }}>
          <img
            src={ServerLoadingBackground}
            alt="Loading background"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(2px) brightness(0.5)',
              transform: 'scale(1.05)',
            }}
          />
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            padding: '40px',
            textAlign: 'center',
          }}>
            <img
              src={loadingSpinner}
              alt="Loading"
              style={{
                width: '120px',
                height: '120px',
                marginBottom: '32px',
                animation: 'spin 1.2s linear infinite',
              }}
            />

            <p style={{
              fontSize: '32px',
              fontWeight: 700,
              margin: 0,
              opacity: 0.95,
              letterSpacing: '0.2px',
              textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)',
            }}>
              {message}
            </p>

            {initializationStep === 'exchanging_token' && (
              <p style={{
                fontSize: '18px',
                margin: 0,
                opacity: 0.85,
                marginTop: '20px',
                textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.7)',
              }}>
                First load may take a moment...
              </p>
            )}
          </div>

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </ActivityContext.Provider>
  );
}