/**
 * Optimized Polling-based API for Discord Activity
 * Replaces WebSocket with efficient HTTP polling
 */

const API_BASE_URL = '/api';

// Polling configuration
const POLL_INTERVALS = {
  FAST: 800,      // During active gameplay (question in progress)
  NORMAL: 1500,   // Normal state
  SLOW: 5000,     // Idle/waiting state
  RETRY: 2000,    // After an error
};

class ProxyGameAPI {
  constructor() {
    this.roomId = null;
    this.playerId = null;
    this.playerName = null;
    this.pollTimer = null;
    this.isPolling = false;
    this.consecutiveErrors = 0;
    this.maxErrors = 5;
    this.lastPollTime = 0;
    this.gameStateCallback = null;
    this.pollInterval = POLL_INTERVALS.NORMAL;
    this.isPaused = false;
  }

  /**
   * Initialize the API with room and player info
   */
  init(roomId, playerId, playerName) {
    this.roomId = roomId;
    this.playerId = playerId;
    this.playerName = playerName;
  }

  /**
   * Set callback for game state updates
   */
  onGameState(callback) {
    this.gameStateCallback = callback;
  }

  /**
   * Start polling for game state
   */
  startPolling(fastMode = false) {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.isPaused = false;
    this.pollInterval = fastMode ? POLL_INTERVALS.FAST : POLL_INTERVALS.NORMAL;
    this.consecutiveErrors = 0;
    
    // Start immediately
    this._poll();
  }

  /**
   * Stop polling
   */
  stopPolling() {
    this.isPolling = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Pause polling temporarily (e.g., during transitions)
   */
  pausePolling() {
    this.isPaused = true;
  }

  /**
   * Resume polling
   */
  resumePolling() {
    this.isPaused = false;
  }

  /**
   * Set polling speed
   */
  setFastMode(fast) {
    this.pollInterval = fast ? POLL_INTERVALS.FAST : POLL_INTERVALS.NORMAL;
  }

  /**
   * Internal polling function
   */
  async _poll() {
    if (!this.isPolling || !this.roomId) return;

    // Skip if paused but schedule next poll
    if (this.isPaused) {
      this.pollTimer = setTimeout(() => this._poll(), this.pollInterval);
      return;
    }

    const now = Date.now();
    this.lastPollTime = now;

    try {
      const response = await fetch(`${API_BASE_URL}/game-state/${this.roomId}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data?.success && this.gameStateCallback) {
        this.gameStateCallback(data);
      }

      // Reset error count on success
      this.consecutiveErrors = 0;

    } catch (error) {
      console.error('[ProxyAPI] Poll error:', error.message);
      this.consecutiveErrors++;

      // Stop polling after too many errors
      if (this.consecutiveErrors >= this.maxErrors) {
        console.error('[ProxyAPI] Too many errors, stopping polling');
        this.stopPolling();
        return;
      }
    }

    // Schedule next poll
    if (this.isPolling) {
      const delay = this.consecutiveErrors > 0 
        ? POLL_INTERVALS.RETRY 
        : this.pollInterval;
      this.pollTimer = setTimeout(() => this._poll(), delay);
    }
  }

  /**
   * Join a room
   */
  async joinRoom(roomId, playerId, playerName) {
    this.init(roomId, playerId, playerName);
    
    try {
      const response = await fetch(`${API_BASE_URL}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerId, playerName }),
      });
      return await response.json();
    } catch (error) {
      console.error('[ProxyAPI] Join error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start a new question
   */
  async startQuestion(forceNew = false) {
    if (!this.roomId) return { success: false, error: 'No room' };

    try {
      const response = await fetch(`${API_BASE_URL}/start_question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          playerId: this.playerId,
          forceNew,
        }),
      });
      
      const result = await response.json();
      
      // Start fast polling when question starts
      if (result.success) {
        this.setFastMode(true);
      }
      
      return result;
    } catch (error) {
      console.error('[ProxyAPI] Start question error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit an answer selection
   */
  async selectOption(optionIndex, timeTaken, isCorrect = null, cardAnswer = null) {
    if (!this.roomId || !this.playerId) return { success: false, error: 'Not initialized' };

    const payload = {
      roomId: this.roomId,
      playerId: this.playerId,
      playerName: this.playerName,
      timeTaken,
    };

    if (cardAnswer !== null) {
      payload.cardAnswer = cardAnswer;
      payload.isCorrect = isCorrect;
    } else {
      payload.optionIndex = optionIndex;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/game-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'select_option',
          data: payload,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('[ProxyAPI] Select option error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * End the current round
   */
  async endRound() {
    if (!this.roomId) return { success: false, error: 'No room' };

    try {
      const response = await fetch(`${API_BASE_URL}/game-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'end_round',
          data: { roomId: this.roomId },
        }),
      });
      
      // Switch to normal polling after round ends
      this.setFastMode(false);
      
      return await response.json();
    } catch (error) {
      console.error('[ProxyAPI] End round error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset scores
   */
  async resetScores() {
    if (!this.roomId) return { success: false, error: 'No room' };

    try {
      const response = await fetch(`${API_BASE_URL}/game-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'reset_scores',
          data: { roomId: this.roomId },
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('[ProxyAPI] Reset scores error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current game state (single fetch)
   */
  async getGameState() {
    if (!this.roomId) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/game-state/${this.roomId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[ProxyAPI] Get game state error:', error);
      return null;
    }
  }

  /**
   * Check server health
   */
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopPolling();
    this.roomId = null;
    this.playerId = null;
    this.gameStateCallback = null;
  }
}

// Singleton instance
const proxyApi = new ProxyGameAPI();

export { proxyApi, ProxyGameAPI, POLL_INTERVALS };
