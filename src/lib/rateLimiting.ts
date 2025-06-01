
// Enhanced rate limiting utilities for security
interface RateLimitAttempt {
  count: number;
  lastAttempt: number;
  lockoutUntil?: number;
}

const loginAttempts = new Map<string, RateLimitAttempt>();
const registrationAttempts = new Map<string, RateLimitAttempt>();

// Rate limiting configuration
const RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
  },
  registration: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutDuration: 2 * 60 * 60 * 1000, // 2 hours
  },
};

export const checkRateLimit = (
  identifier: string,
  type: 'login' | 'registration'
): { allowed: boolean; remainingAttempts?: number; lockoutUntil?: number } => {
  const config = RATE_LIMITS[type];
  const attempts = type === 'login' ? loginAttempts : registrationAttempts;
  const now = Date.now();
  const attempt = attempts.get(identifier);

  if (!attempt) {
    attempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: config.maxAttempts - 1 };
  }

  // Check if currently in lockout
  if (attempt.lockoutUntil && now < attempt.lockoutUntil) {
    return { allowed: false, lockoutUntil: attempt.lockoutUntil };
  }

  // Reset if window has expired
  if (now - attempt.lastAttempt > config.windowMs) {
    attempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: config.maxAttempts - 1 };
  }

  // Increment attempt count
  const newCount = attempt.count + 1;

  if (newCount >= config.maxAttempts) {
    const lockoutUntil = now + config.lockoutDuration;
    attempts.set(identifier, { 
      count: newCount, 
      lastAttempt: now, 
      lockoutUntil 
    });
    return { allowed: false, lockoutUntil };
  }

  attempts.set(identifier, { count: newCount, lastAttempt: now });
  return { allowed: true, remainingAttempts: config.maxAttempts - newCount };
};

export const resetRateLimit = (identifier: string, type: 'login' | 'registration'): void => {
  const attempts = type === 'login' ? loginAttempts : registrationAttempts;
  attempts.delete(identifier);
};

export const formatLockoutTime = (lockoutUntil: number): string => {
  const now = Date.now();
  const remainingMs = lockoutUntil - now;
  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
  
  if (remainingMinutes > 60) {
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    return `${hours}h ${minutes}min`;
  }
  
  return `${remainingMinutes} minutos`;
};
