// Discord Activities with URL mapping configured
// /api -> impressed-henry-probability-buf.trycloudflare.com (backend tunnel)

class DiscordProxySocket {
  constructor() {
    this.connected = false;
    this.localMode = true;
    this.eventCallbacks = new Map();
    // Use relative URLs - Discord will proxy to your mapped backend
    this.serverUrl = '/api';
  }
  
  async connect() {
    try {
      console.log('🔍 Testing Discord proxy connection to backend...');
      console.log('🔗 Trying URL:', `${this.serverUrl}/health`);
      
      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.text();
        console.log('📡 Response data:', data);
        this.connected = true;
        this.localMode = false;
        console.log('🌐 Multiplayer mode enabled via Discord proxy!');
        return true;
      } else {
        const errorText = await response.text();
        throw new Error(`Server responded with status: ${response.status}, body: ${errorText}`);
      }
    } catch (error) {
      console.log('⚠️ Discord proxy connection failed:', error.message);
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
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (error) {
        console.log('📡 Failed to send to server:', error.message);
        console.log('🏠 Switching to local mode');
        this.localMode = true;
        this.handleLocalEvent(event, data);
      }
    } else {
      this.handleLocalEvent(event, data);
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
