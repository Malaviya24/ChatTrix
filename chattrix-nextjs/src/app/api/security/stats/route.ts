import { NextRequest, NextResponse } from 'next/server';
import { securityService } from '@/lib/security';
import { getClientIP, getUserAgent } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);
    
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
    
    const { action, targetIP } = await request.json();
    
    if (action === 'unblock' && targetIP) {
      // Allow unblocking any IP for development purposes
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
