/**
 * Production-safe logging utility
 * Automatically strips sensitive information in production mode
 */

const isProd = import.meta.env.PROD;
const isDebug = import.meta.env.VITE_DEBUG === 'true';

// Sensitive patterns to redact
const SENSITIVE_PATTERNS = [
  /discord\.com/gi,
  /oauth/gi,
  /token/gi,
  /client_id/gi,
  /secret/gi,
  /authorization/gi,
  /bearer/gi
];

// Function to sanitize sensitive data
function sanitizeData(data) {
  if (isProd && !isDebug) {
    if (typeof data === 'string') {
      let sanitized = data;
      SENSITIVE_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      });
      return sanitized;
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      Object.keys(data).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('token') || 
            lowerKey.includes('secret') || 
            lowerKey.includes('password') ||
            lowerKey.includes('auth') ||
            lowerKey.includes('key')) {
          sanitized[key] = '[REDACTED]';
        } else if (lowerKey.includes('id') && typeof data[key] === 'string' && data[key].length > 10) {
          // Partially redact long IDs (keep first 4 chars)
          sanitized[key] = data[key].substring(0, 4) + '***';
        } else {
          sanitized[key] = data[key];
        }
      });
      return sanitized;
    }
  }
  
  return data;
}

// Production-safe logger
export const logger = {
  log: (...args) => {
    if (isProd && !isDebug) {
      // In production, only log if explicitly debug mode
      return;
    }
    const sanitizedArgs = args.map(sanitizeData);
    console.log(...sanitizedArgs);
  },
  
  error: (...args) => {
    // Always log errors, but sanitize them
    const sanitizedArgs = args.map(sanitizeData);
    console.error(...sanitizedArgs);
  },
  
  warn: (...args) => {
    // Always log warnings, but sanitize them
    const sanitizedArgs = args.map(sanitizeData);
    console.warn(...sanitizedArgs);
  },
  
  info: (...args) => {
    if (isProd && !isDebug) {
      return;
    }
    const sanitizedArgs = args.map(sanitizeData);
    console.info(...sanitizedArgs);
  },
  
  debug: (...args) => {
    if (isProd && !isDebug) {
      return;
    }
    const sanitizedArgs = args.map(sanitizeData);
    console.log('[DEBUG]', ...sanitizedArgs);
  }
};

// For production-safe user/room ID logging
export const safeLog = {
  user: (message, userId) => {
    if (isProd && !isDebug) {
      logger.log(message, 'user_***');
    } else {
      logger.log(message, userId);
    }
  },
  
  room: (message, roomId) => {
    if (isProd && !isDebug) {
      logger.log(message, 'room_***');
    } else {
      logger.log(message, roomId);
    }
  },
  
  event: (event, data = {}) => {
    if (isProd && !isDebug) {
      logger.log(`🎮 ${event}`, '[data_redacted]');
    } else {
      logger.log(`🎮 ${event}`, data);
    }
  }
};

export default logger;