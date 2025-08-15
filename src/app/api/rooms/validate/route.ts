import { NextRequest, NextResponse } from 'next/server';
import { roomStorage } from '@/lib/roomStorage';
import { securityService } from '@/lib/security';
import { getClientIP, getUserAgent } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Get client IP and user agent for security logging
    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);
    
    // Check if IP is blocked
    if (securityService.isIPBlocked(clientIP)) {
      securityService.logAccess('BLOCKED', 'attempt', clientIP, userAgent, false, 'IP blocked');
      return NextResponse.json(
        { error: 'Access denied. Your IP has been blocked due to suspicious activity.' },
        { status: 403 }
      );
    }
    
    const { roomId } = await request.json();

    if (!roomId || typeof roomId !== 'string') {
      securityService.logAccess('INVALID_ROOM_ID', 'attempt', clientIP, userAgent, false, 'Invalid room ID format');
      return NextResponse.json(
        { error: 'Room ID is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if room exists
    const room = roomStorage.getRoom(roomId);
    
    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Room validation for:', roomId, { room: !!room, roomId: roomId });
    }
    
    if (!room) {
      securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, 'Room not found');
      return NextResponse.json({
        exists: false,
        message: 'Room not found'
      });
    }

    // Check if room is active
    if (!room.isActive) {
      securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, 'Room inactive');
      return NextResponse.json({
        exists: true,
        isActive: false,
        message: 'Room is no longer active'
      });
    }

    // Check if room has expired (disabled for unlimited rooms)
    // if (room.expiresAt && new Date() > room.expiresAt) {
    //   securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, 'Room expired');
    //   return NextResponse.json({
    //     exists: true,
    //     isActive: false,
    //     isExpired: true,
    //     message: 'Room has expired'
    //   });
    // }

    // Check if room is in panic mode
    if (room.panicMode) {
      securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, 'Room in panic mode');
      return NextResponse.json({
        exists: true,
        isActive: false,
        panicMode: true,
        message: 'Room is in panic mode'
      });
    }

    // Check room capacity
    const currentUsers = room.participants?.length ?? 0;
    const isAtCapacity = currentUsers >= room.maxUsers;

    // Log successful validation
    securityService.logAccess(roomId, 'attempt', clientIP, userAgent, true);

    return NextResponse.json({
      exists: true,
      isActive: true,
      room: {
        id: room.id,
        name: room.name,
        isPrivate: room.isPrivate,
        currentUsers,
        maxUsers: room.maxUsers,
        isAtCapacity,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt
      },
      message: 'Room is available'
    });

  } catch (error) {
    console.error('Error validating room:', error);
    return NextResponse.json(
      { error: 'Failed to validate room. Please try again.' },
      { status: 500 }
    );
  }
}
