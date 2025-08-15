import { NextRequest, NextResponse } from 'next/server';
import { roomStorage } from '@/lib/roomStorage';
import { securityService } from '@/lib/security';
import { getClientIP, getUserAgent, generateRoomId } from '@/lib/utils';

// Room creation endpoint with security measures
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
    
    // Check rate limiting
    const rateLimit = securityService.checkRateLimit(clientIP, 'create');
    if (!rateLimit.allowed) {
      securityService.logAccess('RATE_LIMITED', 'attempt', clientIP, userAgent, false, 'Rate limit exceeded');
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. You can only create 3 rooms per hour.',
          resetTime: rateLimit.resetTime,
          remaining: rateLimit.remaining
        },
        { status: 429 }
      );
    }
    
         const {
       roomName,
       password,
       maxUsers = 10,
       isPrivate = true,
 
       panicMode = false,
       invisibleMode = false
     } = await request.json();
     
     // Message expiry is fixed at 10 minutes for security
     const messageExpiration = 10;

    // Enhanced input validation
    const roomNameValidation = securityService.validateInput(roomName, 'roomName');
    if (!roomNameValidation.valid) {
      securityService.logAccess('INVALID_INPUT', 'attempt', clientIP, userAgent, false, `Room name validation failed: ${roomNameValidation.errors.join(', ')}`);
      return NextResponse.json(
        { error: 'Invalid room name: ' + roomNameValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    if (isPrivate && password) {
      const passwordValidation = securityService.validateInput(password, 'password');
      if (!passwordValidation.valid) {
        securityService.logAccess('INVALID_INPUT', 'attempt', clientIP, userAgent, false, `Password validation failed: ${passwordValidation.errors.join(', ')}`);
        return NextResponse.json(
          { error: 'Invalid password: ' + passwordValidation.errors.join(', ') },
          { status: 400 }
        );
      }
    }

    if (maxUsers < 2 || maxUsers > 50) {
      securityService.logAccess('INVALID_INPUT', 'attempt', clientIP, userAgent, false, 'Invalid max users');
      return NextResponse.json(
        { error: 'Maximum users must be between 2 and 50' },
        { status: 400 }
      );
    }

    // Generate unique room ID
    const roomId = await generateUniqueRoomId();
    
    // Hash room password if private
    let hashedPassword = '';
    if (isPrivate && password) {
      hashedPassword = await hashPassword(password);
    }

    // Create room data
    const roomData = {
      id: roomId,
      name: roomNameValidation.sanitized,
      password: hashedPassword,
      maxUsers,
      isPrivate,
      messageExpiration,
      
      panicMode,
      invisibleMode,
      creatorIP: clientIP,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours for display purposes only (rooms are unlimited)
      isActive: true,
      participants: [],
      messages: []
    };
    
    console.log('⏰ Room expiry calculation:', { 
      now: new Date().toISOString(), 
      expiresAt: roomData.expiresAt.toISOString(),
      timeUntilExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds (display only)
      note: 'Rooms are unlimited - expiry is for display purposes only'
    });

    // Store room data in shared storage
    console.log('💾 Before storing room:', { roomId, storageSize: roomStorage.getAllRooms().length });
    roomStorage.setRoom(roomId, roomData);
    console.log('💾 After storing room:', { roomId, storageSize: roomStorage.getAllRooms().length });
    
    // Log successful room creation
    securityService.logAccess(roomId, 'create', clientIP, userAgent, true);
    
    console.log('🏠 Room created and stored:', { 
      id: roomId, 
      name: roomNameValidation.sanitized, 
      password: hashedPassword ? '[HASHED]' : 'none',
      isPrivate: isPrivate,
      creatorIP: clientIP,
      storageSize: roomStorage.getAllRooms().length,
      rateLimitRemaining: rateLimit.remaining
    });
    
    // Verify room was stored correctly
    const storedRoom = roomStorage.getRoom(roomId);
    console.log('✅ Verification - Room retrieved after storage:', { 
      stored: !!storedRoom, 
      roomId: storedRoom?.id, 
      isActive: storedRoom?.isActive,
      expiresAt: storedRoom?.expiresAt
    });
    
    // Also check if room exists in the storage
    const roomExists = roomStorage.hasRoom(roomId);
    console.log('🔍 Room exists check after storage:', { roomId, exists: roomExists });
    
    // Check all rooms in storage
    const allRooms = roomStorage.getAllRooms();
    console.log('📋 All rooms in storage after creation:', allRooms.map(r => ({ id: r.id, name: r.name, isActive: r.isActive })));

    return NextResponse.json({
      success: true,
      message: 'Room created successfully',
      room: {
        id: roomId,
        name: roomNameValidation.sanitized,
        maxUsers,
        isPrivate,
        messageExpiration,
        
        panicMode,
        invisibleMode,
        createdAt: roomData.createdAt,
        expiresAt: roomData.expiresAt,
        isActive: roomData.isActive
      },
      security: {
        unlimitedRooms: true,
        message: 'Unlimited room creation enabled'
      }
    });

  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room. Please try again.' },
      { status: 500 }
    );
  }
}

// Get rooms list (public, but with security logging)
export async function GET(request: NextRequest) {
  try {
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
    
    // Get all active rooms
    const rooms = roomStorage.getAllRooms().filter(room => room.isActive);
    
    // Return room list with basic info (no sensitive data)
    const roomList = rooms.map(room => ({
      id: room.id,
      name: room.name,
      isPrivate: room.isPrivate,
      currentUsers: room.participants?.length || 0,
      maxUsers: room.maxUsers,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
      isActive: room.isActive
    }));

    // Log successful access
    securityService.logAccess('ROOM_LIST', 'attempt', clientIP, userAgent, true);

    return NextResponse.json({
      success: true,
      rooms: roomList,
      total: roomList.length
    });

  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms. Please try again.' },
      { status: 500 }
    );
  }
}

// Generate unique room ID
async function generateUniqueRoomId(): Promise<string> {
  let roomId: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    roomId = generateRoomId();
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Failed to generate unique room ID after maximum attempts');
    }
  } while (!(await isRoomIdUnique(roomId)));

  return roomId;
}

// Check if room ID is unique
async function isRoomIdUnique(roomId: string): Promise<boolean> {
  return !roomStorage.hasRoom(roomId);
}

// Simple password hashing (in production, use bcrypt)
async function hashPassword(password: string): Promise<string> {
  // For demo purposes, create a simple hash
  // In production, use: return bcrypt.hash(password, 12);
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'chattrix_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
