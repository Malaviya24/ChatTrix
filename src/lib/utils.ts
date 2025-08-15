import { NextRequest } from 'next/server';

// Get client IP address from request
export function getClientIP(request: NextRequest): string {
  // Check various headers for real IP (in case of proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to connection remote address
  return '127.0.0.1'; // Default for local development
}

// Get user agent from request
export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

// Generate secure random string
export async function generateSecureString(length: number): Promise<string> {
  if (length <= 0) {
    throw new Error('Length must be positive');
  }
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Use crypto.getRandomValues if available (browser) or crypto.randomBytes (Node.js)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      // Map random byte to character index using modulo
      const charIndex = randomValues[i] % chars.length;
      result += chars.charAt(charIndex);
    }
  } else {
    // Node.js environment
    try {
      // Dynamic import for Node.js crypto
      const crypto = await import('crypto');
      const randomBytes = crypto.randomBytes(length);
      
      for (let i = 0; i < length; i++) {
        const charIndex = randomBytes[i] % chars.length;
        result += chars.charAt(charIndex);
      }
    } catch {
      // Fallback to Math.random if crypto is not available
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
  }
  
  return result;
}

// Generate unique room ID
export async function generateRoomId(): Promise<string> {
  return generateSecureString(8);
}

// Generate unique user ID
export async function generateUserId(): Promise<string> {
  let randomPart: string;
  
  // Use crypto.getRandomValues if available (browser) or crypto.randomUUID (Node.js)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment
    const randomValues = new Uint8Array(9);
    crypto.getRandomValues(randomValues);
    randomPart = Array.from(randomValues, byte => byte.toString(36)).join('').substring(0, 9);
  } else {
    // Node.js environment
    try {
      // Dynamic import for Node.js crypto
      const crypto = await import('crypto');
      randomPart = crypto.randomUUID().replace(/-/g, '').substring(0, 9);
    } catch {
      // Fallback to Math.random if crypto is not available
      randomPart = Math.random().toString(36).slice(2); // Remove "0." prefix
      // Ensure we have at least 9 characters by concatenating additional chunks
      while (randomPart.length < 9) {
        randomPart += Math.random().toString(36).slice(2);
      }
      randomPart = randomPart.substring(0, 9); // Take exactly 9 characters
    }
  }
  
  return 'user_' + randomPart + '_' + Date.now();
}

// Generate unique session ID
export async function generateSessionId(): Promise<string> {
  let randomPart: string;
  
  // Use crypto.getRandomValues if available (browser) or crypto.randomUUID (Node.js)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment
    const randomValues = new Uint8Array(9);
    crypto.getRandomValues(randomValues);
    randomPart = Array.from(randomValues, byte => byte.toString(36)).join('').substring(0, 9);
  } else {
    // Node.js environment
    try {
      // Dynamic import for Node.js crypto
      const crypto = await import('crypto');
      randomPart = crypto.randomUUID().replace(/-/g, '').substring(0, 9);
    } catch {
      // Fallback to Math.random if crypto is not available
      randomPart = Math.random().toString(36).slice(2); // Remove "0." prefix
      // Ensure we have at least 9 characters by concatenating additional chunks
      while (randomPart.length < 9) {
        randomPart += Math.random().toString(36).slice(2);
      }
      randomPart = randomPart.substring(0, 9); // Take exactly 9 characters
    }
  }
  
  return 'session_' + randomPart;
}

// Validate room ID format
export function isValidRoomId(roomId: string): boolean {
  return /^[A-Z0-9]{8}$/.test(roomId);
}

// Sanitize HTML content
export function sanitizeHTML(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Format timestamp for display
export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Calculate time remaining until expiry
export function getTimeRemaining(expiryDate: Date): { minutes: number; seconds: number } {
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { minutes: 0, seconds: 0 };
  }
  
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { minutes, seconds };
}
