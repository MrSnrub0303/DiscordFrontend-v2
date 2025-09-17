// Discord Activities with URL mapping configured
// /api -> discordbackend-xggi.onrender.com (production backend)

class DiscordProxySocket {
  constructor() {
    this.connected = false;
    this.localMode = true;
    this.eventCallbacks = new Map();
    // Use relative URLs - Discord will proxy to your mapped backend
    this.serverUrl = '/api';
  }
  
  async connect() {
    // TEMPORARY: For debugging production issues, let's skip the health check
    // and directly try to connect to the multiplayer endpoints
    console.log('🔧 TEMPORARY: Skipping health check, trying direct connection...');
    console.log('🌍 Current environment:', {
      href: window.location.href,
      origin: window.location.origin,
      hostname: window.location.hostname,
      protocol: window.location.protocol
    });
    
    // Try to make a simple request to test connectivity
    try {
      console.log('🔗 Testing connection to game-state endpoint...');
      const testResponse = await fetch(`${this.serverUrl}/game-state/test-room-123`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('📡 Test response status:', testResponse.status);
      console.log('📡 Test response ok:', testResponse.ok);
      
      if (testResponse.ok || testResponse.status === 200) {
        console.log('✅ Direct connection successful - enabling multiplayer mode!');
        this.connected = true;
        this.localMode = false;
        console.log('🔧 Socket state changed:', { connected: this.connected, localMode: this.localMode });
        return true;
      } else {
        throw new Error(`Test request failed with status: ${testResponse.status}`);
      }
    } catch (error) {
      console.log('⚠️ Direct connection test failed:', error.message);
      console.log('🔍 Error details:', error);
    }
    
    // Original health check logic as fallback
    try {
      console.log('🔍 Testing Discord proxy connection to backend...');
      console.log('🔗 Trying URL:', `${this.serverUrl}/health`);
      console.log('🌍 Current location:', window.location.href);
      console.log('🌍 User agent:', navigator.userAgent);
      
      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
        // Removed timeout as it may not be supported in all environments
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.text();
        console.log('📡 Response data:', data);
        this.connected = true;
        this.localMode = false;
        console.log('🌐 Multiplayer mode enabled via Discord proxy!');
        console.log('🔧 Socket state changed:', { connected: this.connected, localMode: this.localMode });
        return true;
      } else {
        const errorText = await response.text();
        throw new Error(`Server responded with status: ${response.status}, body: ${errorText}`);
      }
    } catch (error) {
      console.log('⚠️ Discord proxy connection failed:', error.message);
      console.log('🔍 Error details:', error);
      console.log('🔄 Retrying connection in 3 seconds...');
      
      // Retry once after a delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        console.log('🔄 Retry attempt...');
        const retryResponse = await fetch(`${this.serverUrl}/health`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        console.log('🔄 Retry response status:', retryResponse.status);
        console.log('🔄 Retry response ok:', retryResponse.ok);
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.text();
          console.log('✅ Retry successful - multiplayer mode enabled!');
          console.log('📡 Retry response data:', retryData);
          this.connected = true;
          this.localMode = false;
          return true;
        } else {
          const retryErrorText = await retryResponse.text();
          throw new Error(`Retry failed with status: ${retryResponse.status}, body: ${retryErrorText}`);
        }
      } catch (retryError) {
        console.log('⚠️ Retry also failed:', retryError.message);
        console.log('🔍 Retry error details:', retryError);
      }
      
      console.log('🏠 Falling back to local single-player mode');
      this.localMode = true;
      this.connected = true;
      return false;
    }
  }
  
  disconnect() {
    this.connected = false;
  }
  
  async emit(event, data) {
    if (!this.localMode && this.connected) {
      try {
        const response = await fetch(`${this.serverUrl}/game-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, data })
        });
        
        if (response.ok) {
          console.log(`📡 Sent ${event} to server via Discord proxy`);
          
          // Handle response data for actions like start_question
          const responseData = await response.json();
          
          // For callbacks like start_question, trigger the event callback
          if (responseData.action && this.eventCallbacks.has(responseData.action)) {
            const callback = this.eventCallbacks.get(responseData.action);
            callback(responseData.data);
          }
          
          // Return the full response data so .then() can access it
          return responseData;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (error) {
        console.log('📡 Failed to send to server:', error.message);
        console.log('🏠 Switching to local mode');
        this.localMode = true;
        this.handleLocalEvent(event, data);
        return null;
      }
    } else {
      this.handleLocalEvent(event, data);
      return null;
    }
  }
  
  on(event, callback) {
    this.eventCallbacks.set(event, callback);
  }
  
  off(event, callback) {
    this.eventCallbacks.delete(event);
  }
  
  handleLocalEvent(event, data) {
    switch (event) {
      case 'start_question':
        setTimeout(() => {
          const callback = this.eventCallbacks.get('question_started');
          if (callback) {
            callback({ question: null, timeLeft: 15 });
          }
        }, 100);
        break;
        
      case 'select_option':
        console.log('🎯 Local answer recorded');
        break;
    }
  }
}

export const socket = new DiscordProxySocket();

// TODO: To enable real multiplayer later:
// 1. Set up URL mappings in Discord Developer Portal: /api -> your-backend-domain.com
// 2. Replace LocalSocket with HttpSocket that uses relative URLs (/api/health, /api/game-event)
// 3. The Discord proxy will automatically route requests to your mapped backend
