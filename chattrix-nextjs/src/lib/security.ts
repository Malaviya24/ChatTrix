// Security service for room creation and access control
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface AccessLog {
  roomId: string;
  action: 'create' | 'join' | 'attempt';
  ip: string;
  timestamp: Date;
  userAgent?: string;
  success: boolean;
  reason?: string;
}

class SecurityService {
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private accessLogs: AccessLog[] = [];
  private blockedIPs = new Set<string>();
  private suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
  ];

  // Rate limiting: max 3 rooms per IP per hour (DISABLED for room creation)
  checkRateLimit(ip: string, action: 'create' | 'join' | 'attempt' = 'attempt'): { allowed: boolean; remaining: number; resetTime: number } {
    // Skip rate limiting for room creation - allow unlimited rooms
    if (action === 'create') {
      return { allowed: true, remaining: -1, resetTime: 0 }; // -1 means unlimited
    }
    
    const now = Date.now();
    const entry = this.rateLimitMap.get(ip);
    
    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + (60 * 60 * 1000) // 1 hour
      });
      return { allowed: true, remaining: 2, resetTime: now + (60 * 60 * 1000) };
    }
    
    if (entry.count >= 3) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }
    
    entry.count++;
    return { allowed: true, remaining: 3 - entry.count, resetTime: entry.resetTime };
  }

  // Enhanced input validation
  validateInput(input: string, type: 'roomName' | 'nickname' | 'password'): { valid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];
    let sanitized = input.trim();
    
    // Check for suspicious patterns
    if (this.suspiciousPatterns.some(pattern => pattern.test(sanitized))) {
      errors.push('Input contains potentially malicious content');
      return { valid: false, sanitized: '', errors };
    }
    
    // Length validation
    if (type === 'roomName') {
      if (sanitized.length < 3) errors.push('Room name must be at least 3 characters');
      if (sanitized.length > 50) errors.push('Room name must be less than 50 characters');
    } else if (type === 'nickname') {
      if (sanitized.length < 2) errors.push('Nickname must be at least 2 characters');
      if (sanitized.length > 20) errors.push('Nickname must be less than 20 characters');
    } else if (type === 'password') {
      if (sanitized.length < 4) errors.push('Password must be at least 4 characters');
      if (sanitized.length > 100) errors.push('Password must be less than 100 characters');
    }
    
    // Character validation - different rules for different input types
    if (type === 'password') {
      // For passwords, allow all printable ASCII characters except < > & " ' to prevent XSS
      // This allows special characters like @#$%^&*+=[]{}|;:,.?/~` for strong passwords
      if (!/^[a-zA-Z0-9\s\-_.,!?()@#$%^*+=\[\]{}|;:/?~`\\]+$/.test(sanitized)) {
        errors.push('Password contains unsupported characters');
      }
    } else {
      // For room names and nicknames, use the more restrictive validation
      if (!/^[a-zA-Z0-9\s\-_.,!?()]+$/.test(sanitized)) {
        errors.push('Input contains invalid characters');
      }
    }
    
    // HTML entity encoding (only for display text, not passwords)
    if (type !== 'password') {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    
    return {
      valid: errors.length === 0,
      sanitized,
      errors
    };
  }

  // Log room access attempts
  logAccess(roomId: string, action: 'create' | 'join' | 'attempt', ip: string, userAgent: string | undefined, success: boolean, reason?: string): void {
    const log: AccessLog = {
      roomId,
      action,
      ip,
      timestamp: new Date(),
      userAgent,
      success,
      reason
    };
    
    this.accessLogs.push(log);
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.accessLogs.length > 1000) {
      this.accessLogs = this.accessLogs.slice(-1000);
    }
    
    // Check for suspicious activity (only for non-create actions)
    if (action !== 'create') {
      this.detectSuspiciousActivity(ip);
    }
  }

  // Detect and block suspicious IPs (only for non-room creation activities)
  private detectSuspiciousActivity(ip: string): void {
    const recentLogs = this.accessLogs.filter(log => 
      log.ip === ip && 
      log.action !== 'create' && // Don't count room creation as suspicious
      log.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );
    
    const failedAttempts = recentLogs.filter(log => !log.success).length;
    const totalAttempts = recentLogs.length;
    
    // Block IP if more than 20 failed attempts in 5 minutes (excluding room creation)
    // Increased threshold to prevent false positives during development
    if (failedAttempts > 20 && totalAttempts > 30) {
      this.blockedIPs.add(ip);
      console.log(`🚫 IP ${ip} blocked due to suspicious activity (excluding room creation)`);
    }
  }

  // Check if IP is blocked
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // Unblock an IP address
  unblockIP(ip: string): boolean {
    const wasBlocked = this.blockedIPs.has(ip);
    this.blockedIPs.delete(ip);
    if (wasBlocked) {
      console.log(`✅ IP ${ip} has been unblocked`);
    }
    return wasBlocked;
  }

  // Get all blocked IPs
  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }

  // Clear all blocked IPs (useful for development)
  clearAllBlockedIPs(): void {
    const count = this.blockedIPs.size;
    this.blockedIPs.clear();
    console.log(`✅ Cleared ${count} blocked IPs`);
  }

  // Get access logs for a specific room
  getRoomAccessLogs(roomId: string): AccessLog[] {
    return this.accessLogs.filter(log => log.roomId === roomId);
  }

  // Get access logs for a specific IP
  getIPAccessLogs(ip: string): AccessLog[] {
    return this.accessLogs.filter(log => log.ip === ip);
  }

  // Clean up old rate limit entries
  cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitMap.delete(ip);
      }
    }
  }

  // Get security statistics
  getStats(): {
    totalLogs: number;
    blockedIPs: number;
    activeRateLimits: number;
    recentActivity: AccessLog[];
    roomCreationStats: {
      totalRooms: number;
      roomsLastHour: number;
      uniqueIPs: number;
    };
  } {
    const now = Date.now();
    const recentActivity = this.accessLogs.filter(log => 
      log.timestamp > new Date(now - 60 * 60 * 1000) // Last hour
    );
    
    const roomCreationLogs = this.accessLogs.filter(log => log.action === 'create');
    const roomsLastHour = roomCreationLogs.filter(log => 
      log.timestamp > new Date(now - 60 * 60 * 1000)
    ).length;
    
    const uniqueIPs = new Set(roomCreationLogs.map(log => log.ip)).size;
    
    return {
      totalLogs: this.accessLogs.length,
      blockedIPs: this.blockedIPs.size,
      activeRateLimits: this.rateLimitMap.size,
      recentActivity,
      roomCreationStats: {
        totalRooms: roomCreationLogs.length,
        roomsLastHour: roomsLastHour,
        uniqueIPs: uniqueIPs
      }
    };
  }
}

// Export singleton instance
export const securityService = new SecurityService();

// Cleanup every 5 minutes
setInterval(() => {
  securityService.cleanup();
}, 5 * 60 * 1000);
