
import DOMPurify from 'dompurify';

// Input sanitization utilities
export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  // Remove potential XSS vectors and normalize whitespace
  return input.trim().replace(/[<>]/g, '').substring(0, 1000);
};

// Enhanced rate limiting utilities
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockoutUntil?: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 60 * 1000; // 1 minute

export const checkRateLimit = (identifier: string): { allowed: boolean; remainingAttempts?: number; lockoutUntil?: number } => {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 };
  }
  
  // Check if currently in lockout
  if (attempts.lockoutUntil && now < attempts.lockoutUntil) {
    return { allowed: false, lockoutUntil: attempts.lockoutUntil };
  }
  
  // Reset if enough time has passed since last attempt
  if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 };
  }
  
  // Increment attempt count
  const newCount = attempts.count + 1;
  
  if (newCount >= MAX_LOGIN_ATTEMPTS) {
    const lockoutUntil = now + LOCKOUT_DURATION;
    loginAttempts.set(identifier, { 
      count: newCount, 
      lastAttempt: now, 
      lockoutUntil 
    });
    return { allowed: false, lockoutUntil };
  }
  
  loginAttempts.set(identifier, { count: newCount, lastAttempt: now });
  return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - newCount };
};

export const resetRateLimit = (identifier: string): void => {
  loginAttempts.delete(identifier);
};

// CSRF token utilities
export const generateCSRFToken = (): string => {
  return crypto.randomUUID();
};

export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  return token === sessionToken;
};

// Enhanced password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('A senha deve ter pelo menos 12 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial');
  }
  
  // Check for common passwords and patterns
  const commonPasswords = ['password', '123456', 'admin', 'qwerty', 'letmein', 'welcome'];
  const lowercasePassword = password.toLowerCase();
  
  if (commonPasswords.some(common => lowercasePassword.includes(common))) {
    errors.push('A senha não pode conter palavras comuns');
  }
  
  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('A senha não pode ter mais de 2 caracteres repetidos consecutivos');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Input validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100;
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
  return phoneRegex.test(phone);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.length <= 100 && !/[<>]/.test(name);
};

// Content Security Policy utilities
export const getCSPHeader = (): string => {
  return "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://bqftkknbvmggcbsubicl.supabase.co;";
};
