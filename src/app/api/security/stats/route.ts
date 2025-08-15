import { NextRequest, NextResponse } from 'next/server';
import { securityService } from '@/lib/security';
import { getClientIP, getUserAgent } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);
    
    // Authentication check - require valid session or API key
    const authHeader = request.headers.get('authorization');
    const sessionToken = request.cookies.get('session')?.value;
    
    // Check if user is authenticated (either via API key or session)
    const isAuthenticated = (process.env.DEBUG_API_KEY && authHeader === `Bearer ${process.env.DEBUG_API_KEY}`) ||
                           (process.env.NODE_ENV === 'development' && sessionToken);
    
    if (!isAuthenticated) {
      securityService.logAccess('UNAUTHORIZED', 'attempt', clientIP, userAgent, false, 'Unauthorized access to security stats');
      return NextResponse.json(
        { error: 'Unauthorized access to security statistics' },
        { status: 401 }
      );
    }
    
    // Role-based authorization check
    // For now, only allow in development or with valid API key
    // In production, you would check user roles here
    if (process.env.NODE_ENV === 'production' && !authHeader?.startsWith('Bearer ')) {
      securityService.logAccess('FORBIDDEN', 'attempt', clientIP, userAgent, false, 'Insufficient permissions for security stats');
      return NextResponse.json(
        { error: 'Insufficient permissions to access security statistics' },
        { status: 403 }
      );
    }
    
    if (securityService.isIPBlocked(clientIP)) {
      securityService.logAccess('BLOCKED', 'attempt', clientIP, userAgent, false, 'IP blocked');
      return NextResponse.json(
        { error: 'Access denied. Your IP has been blocked due to suspicious activity.' },
        { status: 403 }
      );
    }
    
    const stats = securityService.getStats();
    securityService.logAccess('SECURITY_STATS', 'attempt', clientIP, userAgent, true);
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching security stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security stats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);
    
    // Authentication check - require valid session or API key
    const authHeader = request.headers.get('authorization');
    const sessionToken = request.cookies.get('session')?.value;
    
    // Check if user is authenticated (either via API key or session)
    const isAuthenticated = (process.env.DEBUG_API_KEY && authHeader === `Bearer ${process.env.DEBUG_API_KEY}`) ||
                           (process.env.NODE_ENV === 'development' && sessionToken);
    
    if (!isAuthenticated) {
      securityService.logAccess('UNAUTHORIZED', 'attempt', clientIP, userAgent, false, 'Unauthorized access to security actions');
      return NextResponse.json(
        { error: 'Unauthorized access to security actions' },
        { status: 401 }
      );
    }
    
    // Role-based authorization check
    if (process.env.NODE_ENV === 'production' && !authHeader?.startsWith('Bearer ')) {
      securityService.logAccess('FORBIDDEN', 'attempt', clientIP, userAgent, false, 'Insufficient permissions for security actions');
      return NextResponse.json(
        { error: 'Insufficient permissions to perform security actions' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { action, targetIP } = body;
    
    // Validate action parameter
    if (!action || typeof action !== 'string' || !['unblock', 'clearAll'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "unblock" or "clearAll"' },
        { status: 400 }
      );
    }
    
    // Validate targetIP for unblock action
    if (action === 'unblock') {
      if (!targetIP || typeof targetIP !== 'string') {
        return NextResponse.json(
          { error: 'targetIP is required and must be a string for unblock action' },
          { status: 400 }
        );
      }
      
      // Basic IP validation
      const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipPattern.test(targetIP)) {
        return NextResponse.json(
          { error: 'Invalid IP address format' },
          { status: 400 }
        );
      }
    }
    
    if (action === 'unblock' && targetIP) {
      const wasBlocked = securityService.unblockIP(targetIP);
      securityService.logAccess('IP_UNBLOCK', 'attempt', clientIP, userAgent, true, `Unblocked IP: ${targetIP}`);
      
      return NextResponse.json({
        success: true,
        message: wasBlocked ? `IP ${targetIP} has been unblocked` : `IP ${targetIP} was not blocked`,
        wasBlocked
      });
    }
    
    if (action === 'clearAll') {
      // Clear all blocked IPs
      securityService.clearAllBlockedIPs();
      securityService.logAccess('CLEAR_ALL_BLOCKS', 'attempt', clientIP, userAgent, true, 'Cleared all blocked IPs');
      
      return NextResponse.json({
        success: true,
        message: 'All blocked IPs have been cleared'
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use "unblock" with targetIP or "clearAll"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing security action:', error);
    return NextResponse.json(
      { error: 'Failed to process security action' },
      { status: 500 }
    );
  }
}
