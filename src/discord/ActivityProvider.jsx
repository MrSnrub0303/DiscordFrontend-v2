import React, { useEffect, useState, useRef } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import { DISCORD_CLIENT_ID } from './config';
import { ActivityContext } from './ActivityContext';
import loadingSpinner from '../assets/loadingspinner.png';
import ServerLoadingBackground from '../assets/LoadingScreenNew.png';
import { preloadImages } from '../utils/preloadImages';

export { ActivityContext };

const SDK_READY_TIMEOUT_MS = 30000;

// Discord only accepts one SDK handshake per mounted iframe, and after a page reload
// document.referrer becomes our own URL, so the SDK posts its handshake to itself and
// ready() never resolves. Never reload — retry in place, or ask the user to relaunch.
// https://github.com/discord/embedded-app-sdk/issues/41
const RELAUNCH_SUGGESTION = 'Close the activity (X in the top corner) and launch it again from the Activities menu. Refreshing will not fix this.';

const pageWasReloaded = () => {
  try {
    return !!document.referrer && new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
};

// Module-level state so the SDK is only ever created (and handshaken) once per page,
// even if the provider remounts.
let globalInitializationStarted = false;
let globalSdkInstance = null;
let globalSdkReadyPromise = null;
let globalAuthResult = null;

export function ActivityProvider({ children, assetsToPreload = [] }) {
  const [sdk, setSdk] = useState(globalSdkInstance);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(!!globalAuthResult);
  const [token, setToken] = useState(globalAuthResult?.access_token || null);
  const [initializationStep, setInitializationStepState] = useState(globalInitializationStarted ? 'already_started' : 'starting');
  const [debugLogs, setDebugLogs] = useState([]);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(!globalAuthResult);
  const [loadingFadingOut, setLoadingFadingOut] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(null);
  // Refs so the async flow always sees current values (state in its closure would be stale)
  const stepRef = useRef(initializationStep);
  const startTimeRef = useRef(Date.now());
  const runningRef = useRef(false);
  const tokenDataRef = useRef(null);

  const setInitializationStep = (step) => {
    stepRef.current = step;
    setInitializationStepState(step);
  };

  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-4), `[${timestamp}] ${message}`]);
  };

  const buildErrorDetails = (error) => {
    const errorDetails = {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      location: 'SDK Initialization',
      step: stepRef.current,
      elapsedMs: Date.now() - startTimeRef.current,
      platform: globalSdkInstance?.platform,
      mobileAppVersion: globalSdkInstance?.mobileAppVersion,
      sdkVersion: globalSdkInstance?.sdkVersion,
      referrer: document.referrer,
      reloaded: pageWasReloaded(),
      time: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (error.name === 'ActivityRejectedError') {
      errorDetails.suggestion = 'Make sure your activity is approved and running in Discord';
    } else if (error.name === 'AuthorizationError') {
      errorDetails.suggestion = 'Verify your Discord Client ID and application settings';
    } else if (error.code === 4002 || error.message?.includes('Already authing')) {
      errorDetails.suggestion = 'Another authentication is in progress. Please wait a moment and press Retry.';
    } else if (error.isReloaded) {
      errorDetails.message = 'The activity was reloaded, which Discord does not support';
      errorDetails.suggestion = RELAUNCH_SUGGESTION;
      errorDetails.relaunchRequired = true;
    } else if (error.message?.includes('frame_id') || error.message?.includes('instance_id') || error.message?.includes('platform')) {
      errorDetails.suggestion = 'This page must be opened as an Activity inside Discord.';
      errorDetails.relaunchRequired = true;
    } else if (error.message?.includes('timeout')) {
      errorDetails.message = 'Could not connect to Discord';
      errorDetails.suggestion = `Discord did not respond in time. Press Retry to keep waiting, or: ${RELAUNCH_SUGGESTION}`;
    } else if (error.message?.includes('DISCORD_CLIENT_ID')) {
      errorDetails.suggestion = 'Check your config file and ensure DISCORD_CLIENT_ID is properly set';
    } else if (error.message?.includes('Token exchange failed')) {
      if (error.message.includes('500')) {
        errorDetails.message = 'Unstable Network - Server Error';
        errorDetails.suggestion = 'The backend server encountered an error. This might be due to network issues or server configuration. Please try again.';
      } else if (error.message.includes('503') || error.message.includes('502')) {
        errorDetails.message = 'Unstable Network - Service Unavailable';
        if (error.retryAfterSeconds) {
          const minutes = Math.ceil(error.retryAfterSeconds / 60);
          errorDetails.suggestion = `Discord's infrastructure has temporarily rate-limited this server's IP. Auto-retrying in ~${minutes} minute(s)...`;
          errorDetails.autoRetryAfterSeconds = error.retryAfterSeconds;
        } else {
          errorDetails.suggestion = 'The server is temporarily unavailable. Please wait a moment and try again.';
        }
      } else {
        errorDetails.message = 'Unstable Network';
        errorDetails.suggestion = 'Check that your backend server is running and accessible at https://discordbackend-v2.onrender.com';
      }
    } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
      errorDetails.message = 'Unstable Network';
      errorDetails.suggestion = 'Cannot reach backend server. Please check your internet connection.';
    } else if (error.message?.includes('fetch')) {
      errorDetails.message = 'Unstable Network';
      errorDetails.suggestion = 'Network connection issue - please check your internet connection and try again.';
    } else if (error.message?.includes('authenticate')) {
      errorDetails.suggestion = 'Authentication failed - the access token may be invalid';
    } else if (error.message?.includes('already running')) {
      errorDetails.suggestion = 'Another instance is already running. Try closing and reopening the activity.';
    }

    return errorDetails;
  };

  // Creates the SDK once, then runs whichever auth steps haven't completed yet.
  // Safe to call again to retry — it reuses the same SDK instance and handshake.
  const runInitialization = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setError(null);
    setRetryCountdown(null);

    try {
      if (!globalSdkInstance) {
        setInitializationStep('creating_sdk');
        addDebugLog('Initializing Discord SDK...');

        if (!DISCORD_CLIENT_ID) {
          throw new Error('DISCORD_CLIENT_ID is not defined in config');
        }
        addDebugLog(`Using Discord Client ID: ${DISCORD_CLIENT_ID}`);

        setInitializationStep('sdk_instance');
        const discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
        globalSdkInstance = discordSdk;
        globalSdkReadyPromise = discordSdk.ready();
        addDebugLog('SDK instance created');
        setIsMobile(discordSdk.platform === 'mobile');
        setSdk(discordSdk);

        // Resume automatically if Discord's READY arrives after we gave up waiting
        globalSdkReadyPromise.then(() => {
          if (stepRef.current === 'waiting_ready' && !runningRef.current) {
            addDebugLog('SDK became ready after timeout, resuming...');
            runInitialization();
          }
        });
      }
      const discordSdk = globalSdkInstance;

      if (!discordSdk.isReady) {
        setInitializationStep('waiting_ready');
        if (pageWasReloaded()) {
          throw Object.assign(new Error('Page reloaded inside Discord; SDK handshake cannot complete'), { isReloaded: true });
        }
        addDebugLog(`Waiting for SDK to be ready (platform: ${discordSdk.platform})...`);

        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error(`SDK ready timeout after ${SDK_READY_TIMEOUT_MS / 1000} seconds`)),
            SDK_READY_TIMEOUT_MS,
          );
        });
        try {
          await Promise.race([globalSdkReadyPromise, timeoutPromise]);
        } finally {
          clearTimeout(timeoutId);
        }
        addDebugLog('SDK is ready');

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!tokenDataRef.current) {
        setInitializationStep('authorizing');
        addDebugLog('Starting authorization...');

        const authResult = await discordSdk.commands.authorize({
          client_id: DISCORD_CLIENT_ID,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: ['identify', 'guilds', 'guilds.members.read', 'applications.commands'],
        });

        if (!authResult.code) {
          throw new Error('No authorization code received');
        }
        addDebugLog(`Authorization successful, got code: ${authResult.code.substring(0, 10)}...`);

        setInitializationStep('exchanging_token');
        addDebugLog('Exchanging code for token via /api/token...');

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
          const err = new Error(`Token exchange failed: ${response.status} - ${errorText}`);
          if (response.status === 503 || response.status === 502) {
            try {
              const parsed = JSON.parse(errorText);
              if (parsed.retryAfterSeconds) err.retryAfterSeconds = parsed.retryAfterSeconds;
            } catch {}
          }
          throw err;
        }

        const tokenData = await response.json();
        if (!tokenData.access_token) {
          addDebugLog(`No access token in response: ${JSON.stringify(tokenData)}`);
          throw new Error('No access token received from server');
        }
        addDebugLog('Token exchange successful');
        tokenDataRef.current = tokenData;
      }
      const tokenData = tokenDataRef.current;

      if (!globalAuthResult) {
        setInitializationStep('authenticating');
        addDebugLog('Authenticating with Discord...');

        let authResponse;
        try {
          authResponse = await discordSdk.commands.authenticate({
            access_token: tokenData.access_token,
          });
        } catch (err) {
          // Token may be bad; get a fresh one on the next retry
          tokenDataRef.current = null;
          throw err;
        }
        addDebugLog(`Authentication successful: ${authResponse ? 'YES' : 'NO'}`);

        discordSdk.authenticated = authResponse;
        globalAuthResult = { access_token: tokenData.access_token, authResponse };
      }

      setToken(globalAuthResult.access_token);

      // Preload home screen assets before revealing the app
      if (assetsToPreload.length > 0) {
        setInitializationStep('preloading');
        addDebugLog(`Preloading ${assetsToPreload.length} assets...`);
        await preloadImages(assetsToPreload);
        addDebugLog('Assets preloaded.');
      }

      setInitializationStep('complete');
      setReady(true);
      addDebugLog('Discord Activity fully initialized and ready!');
    } catch (error) {
      addDebugLog(`ERROR: ${error.message}`);
      setError(buildErrorDetails(error));
    } finally {
      runningRef.current = false;
    }
  };

  useEffect(() => {
    // Only one provider per page may drive initialization; remounts reuse the result.
    if (globalInitializationStarted) {
      addDebugLog('Global initialization already started, skipping...');
      if (globalSdkInstance && globalAuthResult) {
        setSdk(globalSdkInstance);
        setToken(globalAuthResult.access_token);
        setReady(true);
        setInitializationStep('complete');
      }
      return;
    }

    globalInitializationStarted = true;
    addDebugLog('Starting initialization...');
    runInitialization();
  }, []);

  useEffect(() => {
    if (ready && showLoadingOverlay && !loadingFadingOut) {
      setLoadingFadingOut(true);
      const timer = setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [ready, showLoadingOverlay, loadingFadingOut]);

  useEffect(() => {
    if (!error?.autoRetryAfterSeconds) return;
    setRetryCountdown(error.autoRetryAfterSeconds);
    const interval = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [error]);

  useEffect(() => {
    if (retryCountdown === 0) runInitialization();
  }, [retryCountdown]);

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
      'preloading':     { message: 'Loading assets...', progress: 96 },
      'complete':       { message: 'Ready!', progress: 100 },
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
          <p><strong>Suggestion:</strong> {
            retryCountdown
              ? `Discord's infrastructure has temporarily rate-limited this server's IP. Auto-retrying in ${retryCountdown}s...`
              : error.suggestion
          }</p>
        )}
        <details>
          <summary>Debug Information</summary>
          <pre style={{ fontSize: '12px', marginTop: '10px', overflow: 'auto' }}>
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
        {!error.relaunchRequired && (
          <button
            onClick={() => runInitialization()}
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
            {retryCountdown ? `Retry Now (auto in ${retryCountdown}s)` : 'Retry'}
          </button>
        )}
      </div>
    );
  }

  const { message } = getLoadingInfo();

  return (
    <ActivityContext.Provider value={{ sdk, token, ready, isMobile }}>
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
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            paddingTop: typeof window !== 'undefined' && window.innerWidth < 600 ? '52px' : '0px',
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