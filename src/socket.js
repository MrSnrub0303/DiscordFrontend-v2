// Discord Activities with URL mapping configured
// /api -> discordbackend-xggi.onrender.com (production backend)

class DiscordProxySocket {
  constructor() {
    this.connected = false;
    this.localMode = true;
    this.eventCallbacks = new Map();
    this.stateChangeCallback = null; // Callback for when socket state changes
    // Use relative URLs - Discord will proxy to your mapped backend
    this.serverUrl = '/api';
  }
  
  // Set callback to be called when socket state changes
  onStateChange(callback) {
    this.stateChangeCallback = callback;
  }
  
  // Helper to notify React when state changes
  _notifyStateChange() {
    if (this.stateChangeCallback) {
      this.stateChangeCallback();
    }
    // console.log('🔧 Socket state changed:', { connected: this.connected, localMode: this.localMode });
  }
  
  async connect() {
    try {
      // console.log('🔍 Testing Discord proxy connection to backend...');
      // console.log('🔗 Trying URL:', `${this.serverUrl}/health`);
      
      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      // console.log('📡 Response status:', response.status);
      // console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.text();
        // console.log('📡 Response data:', data);
        this.connected = true;
        this.localMode = false;
        // console.log('🌐 Multiplayer mode enabled via Discord proxy!');
        this._notifyStateChange();
        return true;
      } else {
        const errorText = await response.text();
        throw new Error(`Server responded with status: ${response.status}, body: ${errorText}`);
      }
    } catch (error) {
      // console.log('⚠️ Discord proxy connection failed:', error.message);
      // console.log('🔄 Retrying connection in 3 seconds...');
      
      // Retry once after a delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        const retryResponse = await fetch(`${this.serverUrl}/health`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (retryResponse.ok) {
          // console.log('✅ Retry successful - multiplayer mode enabled!');
          this.connected = true;
          this.localMode = false;
          this._notifyStateChange();
          return true;
        }
      } catch (retryError) {
        // console.log('⚠️ Retry also failed:', retryError.message);
      }
      
      // console.log('🏠 Falling back to local single-player mode');
      this.localMode = true;
      this.connected = true;
      this._notifyStateChange();
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
          // console.log(`📡 Sent ${event} to server via Discord proxy`);
          
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
        // console.log('📡 Failed to send to server:', error.message);
        // console.log('🏠 Switching to local mode');
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
        // console.log('🎯 Local answer recorded');
        break;
    }
  }
}

export { DiscordProxySocket };

// TODO: To enable real multiplayer later:
// 1. Set up URL mappings in Discord Developer Portal: /api -> your-backend-domain.com
// 2. Replace LocalSocket with HttpSocket that uses relative URLs (/api/health, /api/game-event)
// 3. The Discord proxy will automatically route requests to your mapped backend
