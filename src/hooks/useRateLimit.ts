import { useState, useCallback, useMemo } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
}

interface AttemptRecord {
  count: number;
  lastAttempt: number;
}

const useRateLimit = (key: string, config: RateLimitConfig) => {
  const [attempts, setAttempts] = useState<AttemptRecord>({ count: 0, lastAttempt: 0 });

  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const timeSinceLastAttempt = now - attempts.lastAttempt;
    
    // If window has passed, we're not rate limited
    if (attempts.lastAttempt > 0 && timeSinceLastAttempt > config.windowMs) {
      return false;
    }
    
    return attempts.count >= config.maxAttempts;
  }, [attempts.count, attempts.lastAttempt, config.maxAttempts, config.windowMs]);

  const recordAttempt = useCallback(() => {
    const now = Date.now();
    setAttempts(prev => {
      const timeSinceLastAttempt = now - prev.lastAttempt;
      
      // Reset if window has passed
      if (prev.lastAttempt > 0 && timeSinceLastAttempt > config.windowMs) {
        return { count: 1, lastAttempt: now };
      }
      
      // Otherwise increment
      return { count: prev.count + 1, lastAttempt: now };
    });
  }, [config.windowMs]);

  const getRemainingTime = useCallback(() => {
    const now = Date.now();
    const timeSinceLastAttempt = now - attempts.lastAttempt;
    
    // If window has passed or not rate limited, no remaining time
    if (attempts.lastAttempt === 0 || timeSinceLastAttempt > config.windowMs || attempts.count < config.maxAttempts) {
      return 0;
    }
    
    const timeRemaining = config.windowMs - timeSinceLastAttempt;
    return Math.max(0, Math.ceil(timeRemaining / 1000)); // Return seconds
  }, [attempts.count, attempts.lastAttempt, config.maxAttempts, config.windowMs]);

  const reset = useCallback(() => {
    setAttempts({ count: 0, lastAttempt: 0 });
  }, []);

  const attemptsRemaining = useMemo(() => {
    const now = Date.now();
    const timeSinceLastAttempt = now - attempts.lastAttempt;
    
    // If window has passed, reset count for calculation
    if (attempts.lastAttempt > 0 && timeSinceLastAttempt > config.windowMs) {
      return config.maxAttempts;
    }
    
    return Math.max(0, config.maxAttempts - attempts.count);
  }, [attempts.count, attempts.lastAttempt, config.maxAttempts, config.windowMs]);

  return {
    isRateLimited,
    recordAttempt,
    getRemainingTime,
    reset,
    attemptsRemaining
  };
};

export default useRateLimit;