
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  identifier: string;
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

export const useRateLimit = ({ maxAttempts, windowMs, identifier }: RateLimitConfig) => {
  const [attempts, setAttempts] = useState<Map<string, AttemptRecord>>(new Map());
  const [isBlocked, setIsBlocked] = useState(false);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const key = identifier;
    const record = attempts.get(key);

    if (!record) {
      setAttempts(prev => new Map(prev).set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      }));
      return true;
    }

    // Reset window if enough time has passed
    if (now - record.firstAttempt > windowMs) {
      setAttempts(prev => new Map(prev).set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      }));
      setIsBlocked(false);
      return true;
    }

    // Check if rate limit exceeded
    if (record.count >= maxAttempts) {
      const timeLeft = Math.ceil((record.firstAttempt + windowMs - now) / 1000);
      
      toast.error('Muitas tentativas', {
        description: `Tente novamente em ${timeLeft} segundos`,
        duration: 4000,
      });
      
      setIsBlocked(true);
      return false;
    }

    // Increment attempt count
    setAttempts(prev => new Map(prev).set(key, {
      ...record,
      count: record.count + 1,
      lastAttempt: now
    }));

    return true;
  }, [attempts, maxAttempts, windowMs, identifier]);

  const resetRateLimit = useCallback(() => {
    setAttempts(prev => {
      const newMap = new Map(prev);
      newMap.delete(identifier);
      return newMap;
    });
    setIsBlocked(false);
  }, [identifier]);

  const getRemainingAttempts = useCallback(() => {
    const record = attempts.get(identifier);
    if (!record) return maxAttempts;
    
    const now = Date.now();
    if (now - record.firstAttempt > windowMs) {
      return maxAttempts;
    }
    
    return Math.max(0, maxAttempts - record.count);
  }, [attempts, identifier, maxAttempts, windowMs]);

  return {
    checkRateLimit,
    resetRateLimit,
    getRemainingAttempts,
    isBlocked
  };
};
