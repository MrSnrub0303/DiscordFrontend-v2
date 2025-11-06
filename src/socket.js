


class DiscordProxySocket {
  constructor() {
    this.connected = false;
    this.localMode = true;
    this.eventCallbacks = new Map();
    this.stateChangeCallback = null; 
    
    this.serverUrl = '/api';
  }
  
  
  onStateChange(callback) {
    this.stateChangeCallback = callback;
  }
  
  
  _notifyStateChange() {
    if (this.stateChangeCallback) {
      this.stateChangeCallback();
    }
    
  }
  
  async connect() {
    try {
      
      
      
      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 
      });
      
      
      
      
      if (response.ok) {
        const data = await response.text();
        
        this.connected = true;
        this.localMode = false;
        
        this._notifyStateChange();
        return true;
      } else {
        const errorText = await response.text();
        throw new Error(`Server responded with status: ${response.status}, body: ${errorText}`);
      }
    } catch (error) {
      
      
      
      
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
          
          this.connected = true;
          this.localMode = false;
          this._notifyStateChange();
          return true;
        }
      } catch (retryError) {
        
      }
      
      
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
          
          
          
          const responseData = await response.json();
          
          
          if (responseData.action && this.eventCallbacks.has(responseData.action)) {
            const callback = this.eventCallbacks.get(responseData.action);
            callback(responseData.data);
          }
          
          
          return responseData;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (error) {
        
        
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
        
        break;
    }
  }
}

export { DiscordProxySocket };





