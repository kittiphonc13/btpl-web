/**
 * Client-side Rate Limiter
 * Prevents brute force attacks by limiting authentication attempts
 * 
 * Security Features:
 * - Tracks failed attempts per IP/session
 * - Progressive delays (exponential backoff)
 * - Temporary lockouts
 * - Memory-based storage (resets on page refresh)
 */

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  lockoutUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts: number;
  private readonly baseDelay: number; // milliseconds
  private readonly lockoutDuration: number; // milliseconds

  constructor(
    maxAttempts: number = 5,
    baseDelay: number = 1000, // 1 second
    lockoutDuration: number = 15 * 60 * 1000 // 15 minutes
  ) {
    this.maxAttempts = maxAttempts;
    this.baseDelay = baseDelay;
    this.lockoutDuration = lockoutDuration;
  }

  /**
   * Generate a simple client identifier
   * Note: This is not foolproof but provides basic protection
   */
  private getClientId(): string {
    // Use a combination of user agent and screen resolution as identifier
    const userAgent = navigator.userAgent;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Simple hash function
    let hash = 0;
    const str = `${userAgent}-${screen}-${timezone}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Check if the client is currently rate limited
   */
  isRateLimited(identifier?: string): { limited: boolean; retryAfter?: number } {
    const clientId = identifier || this.getClientId();
    const entry = this.attempts.get(clientId);
    
    if (!entry) {
      return { limited: false };
    }

    const now = Date.now();
    
    // Check if still in lockout period
    if (entry.lockoutUntil && now < entry.lockoutUntil) {
      const retryAfter = Math.ceil((entry.lockoutUntil - now) / 1000);
      return { limited: true, retryAfter };
    }

    // Clear expired lockout
    if (entry.lockoutUntil && now >= entry.lockoutUntil) {
      this.attempts.delete(clientId);
      return { limited: false };
    }

    return { limited: false };
  }

  /**
   * Record a failed authentication attempt
   */
  recordFailedAttempt(identifier?: string): { 
    shouldDelay: boolean; 
    delayMs: number; 
    attemptsRemaining: number;
    lockedOut: boolean;
  } {
    const clientId = identifier || this.getClientId();
    const now = Date.now();
    
    let entry = this.attempts.get(clientId) || { attempts: 0, lastAttempt: 0 };
    
    // Reset if last attempt was more than 1 hour ago
    if (now - entry.lastAttempt > 60 * 60 * 1000) {
      entry = { attempts: 0, lastAttempt: 0 };
    }

    entry.attempts += 1;
    entry.lastAttempt = now;

    // Calculate delay (exponential backoff)
    const delayMs = Math.min(
      this.baseDelay * Math.pow(2, entry.attempts - 1),
      30000 // Max 30 seconds delay
    );

    // Check if should be locked out
    if (entry.attempts >= this.maxAttempts) {
      entry.lockoutUntil = now + this.lockoutDuration;
      this.attempts.set(clientId, entry);
      
      return {
        shouldDelay: true,
        delayMs,
        attemptsRemaining: 0,
        lockedOut: true
      };
    }

    this.attempts.set(clientId, entry);
    
    return {
      shouldDelay: entry.attempts > 1,
      delayMs,
      attemptsRemaining: this.maxAttempts - entry.attempts,
      lockedOut: false
    };
  }

  /**
   * Record a successful authentication (clears failed attempts)
   */
  recordSuccessfulAttempt(identifier?: string): void {
    const clientId = identifier || this.getClientId();
    this.attempts.delete(clientId);
  }

  /**
   * Get current attempt count for debugging
   */
  getAttemptCount(identifier?: string): number {
    const clientId = identifier || this.getClientId();
    const entry = this.attempts.get(clientId);
    return entry?.attempts || 0;
  }

  /**
   * Clear all rate limit data (for testing)
   */
  clear(): void {
    this.attempts.clear();
  }
}

// Export singleton instance
export const authRateLimiter = new RateLimiter(
  5,           // Max 5 failed attempts
  2000,        // Start with 2 second delay
  15 * 60 * 1000 // 15 minute lockout
);

// Export class for custom instances
export { RateLimiter };

/**
 * Utility function to create a delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Format time remaining for user display
 */
export const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} วินาที`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes} นาที`;
  }
  
  return `${minutes} นาที ${remainingSeconds} วินาที`;
};
