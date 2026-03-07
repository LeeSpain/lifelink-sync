/**
 * Security utilities for input validation and sanitization
 */

// HTML sanitization function to prevent XSS attacks
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove potentially dangerous attributes
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*['""][^'""]*['""]?/gi, '');
  sanitized = sanitized.replace(/\s*javascript\s*:/gi, '');
  sanitized = sanitized.replace(/\s*vbscript\s*:/gi, '');
  sanitized = sanitized.replace(/\s*data\s*:/gi, '');
  
  // Remove potentially dangerous tags
  const dangerousTags = ['iframe', 'object', 'embed', 'link', 'style', 'meta'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized.trim();
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (international format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Name validation (only letters, spaces, hyphens, apostrophes)
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
  return nameRegex.test(name);
};

// General text sanitization for form inputs
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input) return '';
  
  let sanitized = input.trim();
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

// Password strength validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting check for client-side
export const checkRateLimit = (
  key: string, 
  maxAttempts: number, 
  windowMs: number
): boolean => {
  const now = Date.now();
  const rateLimitKey = `rate_limit_${key}`;
  
  try {
    const stored = localStorage.getItem(rateLimitKey);
    if (!stored) {
      localStorage.setItem(rateLimitKey, JSON.stringify({ count: 1, resetTime: now + windowMs }));
      return true;
    }
    
    const { count, resetTime } = JSON.parse(stored);
    
    if (now > resetTime) {
      localStorage.setItem(rateLimitKey, JSON.stringify({ count: 1, resetTime: now + windowMs }));
      return true;
    }
    
    if (count >= maxAttempts) {
      return false;
    }
    
    localStorage.setItem(rateLimitKey, JSON.stringify({ count: count + 1, resetTime }));
    return true;
  } catch {
    // If localStorage fails, allow the request
    return true;
  }
};

// Log security events
export const logSecurityEvent = async (
  eventType: string,
  metadata?: Record<string, any>
) => {
  try {
    // Enhanced security logging with server-side tracking
    console.warn(`Security Event: ${eventType}`, metadata);
    
    // For authentication failures, also call our auth security monitor
    if (eventType.includes('failure') && metadata?.email) {
      try {
        const response = await fetch('/supabase/functions/v1/auth-security-monitor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: metadata.email,
            failure_reason: metadata.error || eventType,
            ip_address: metadata.ip_address,
            user_agent: metadata.user_agent || navigator.userAgent
          })
        });
        
        if (!response.ok) {
          console.warn('Failed to track auth failure on server:', response.statusText);
        }
      } catch (serverError) {
        console.warn('Failed to connect to auth security monitor:', serverError);
      }
    }
    
    // Store locally for immediate UI feedback
    const securityEvents = JSON.parse(localStorage.getItem('security_events') || '[]');
    securityEvents.unshift({
      id: crypto.randomUUID(),
      event_type: eventType,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      severity: determineSeverity(eventType, metadata)
    });
    
    // Keep only last 100 events in local storage
    securityEvents.splice(100);
    localStorage.setItem('security_events', JSON.stringify(securityEvents));
    
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Determine event severity based on type and metadata
const determineSeverity = (eventType: string, metadata?: Record<string, any>): string => {
  if (eventType.includes('failure') || eventType.includes('denied') || eventType.includes('attack')) {
    return 'high';
  }
  if (eventType.includes('suspicious') || eventType.includes('blocked')) {
    return 'medium';
  }
  return 'low';
};

// Get recent security events from local storage
export const getRecentSecurityEvents = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('security_events') || '[]');
  } catch {
    return [];
  }
};

// Clear local security event cache
export const clearSecurityEventCache = (): void => {
  localStorage.removeItem('security_events');
};