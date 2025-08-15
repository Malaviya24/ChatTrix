import { NextRequest, NextResponse } from 'next/server';
import { roomStorage } from '@/lib/roomStorage';
import { securityService } from '@/lib/security';
import { getClientIP, getUserAgent, generateSessionId } from '@/lib/utils';

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
    
    const { roomId, nickname, password, avatar } = await request.json();

    // Enhanced input validation
    const nicknameValidation = securityService.validateInput(nickname, 'nickname');
    if (!nicknameValidation.valid) {
      securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, `Nickname validation failed: ${nicknameValidation.errors.join(', ')}`);
      return NextResponse.json(
        { error: 'Invalid nickname: ' + nicknameValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    if (password) {
      const passwordValidation = securityService.validateInput(password, 'password');
      if (!passwordValidation.valid) {
        securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, `Password validation failed: ${passwordValidation.errors.join(', ')}`);
        return NextResponse.json(
          { error: 'Invalid password: ' + passwordValidation.errors.join(', ') },
          { status: 400 }
      );
      }
    }

    // Validate room ID format
    if (!roomId || typeof roomId !== 'string') {
      securityService.logAccess('INVALID_ROOM_ID', 'attempt', clientIP, userAgent, false, 'Invalid room ID format');
      return NextResponse.json(
        { error: 'Room ID is required and must be a string' },
        { status: 400 }
      );
    }

    // Get room data
    const roomData = await getRoomData(roomId);
    if (!roomData) {
      securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, 'Room not found');
      return NextResponse.json(
        { error: 'Room not found. Please check the room ID and try again.' },
        { status: 404 }
      );
    }

    // Check if room is active
    if (!roomData.isActive) {
      securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, 'Room inactive');
      return NextResponse.json(
        { error: 'This room is no longer active. It may have expired or been deleted.' },
        { status: 410 }
      );
    }

    // Check if room has expired (disabled for unlimited rooms)
    // if (roomData.expiresAt && new Date() > roomData.expiresAt) {
    //   securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, 'Room expired');
    //   return NextResponse.json(
    //     { error: 'This room has expired. Rooms automatically expire after 5 minutes.' },
    //     { status: 410 }
    //   );
    // }

    // Check if room is in panic mode
    if (roomData.panicMode) {
      securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, 'Room in panic mode');
      return NextResponse.json(
        { error: 'This room is currently in panic mode and cannot be joined.' },
        { status: 403 }
      );
    }

    // Check room capacity
    const currentUsers = roomData.participants?.length || 0;
    if (currentUsers >= roomData.maxUsers) {
      securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, 'Room at capacity');
      return NextResponse.json(
        { error: 'This room is at maximum capacity. Please try joining another room.' },
        { status: 409 }
      );
    }

    // Validate password for private rooms
    if (roomData.isPrivate && !(await verifyPassword(password, roomData.password))) {
      securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, 'Incorrect password');
      return NextResponse.json(
        { error: 'Incorrect password. Please check the room password and try again.' },
        { status: 401 }
      );
    }

    // Check if user is already in the room
    const existingParticipant = roomData.participants?.find(p => p.ip === clientIP);
    if (existingParticipant) {
      securityService.logAccess(roomId, 'attempt', clientIP, userAgent, false, 'Already in room');
      return NextResponse.json(
        { error: 'You are already in this room.' },
        { status: 409 }
      );
    }

    // Generate user ID and session
    const userId = generateUserId();
    const participantData = {
      userId,
      nickname: nicknameValidation.sanitized,
      avatar: avatar || '🦊',
      sessionId: generateSessionId(),
      ip: clientIP,
      joinedAt: new Date()
    };

    // Add participant to room
    roomStorage.addParticipant(roomId, participantData);
    
    // Log successful join
    securityService.logAccess(roomId, 'join', clientIP, userAgent, true);

    console.log('👤 User joined room:', { 
      roomId, 
      userId, 
      nickname: nicknameValidation.sanitized, 
      ip: clientIP,
      currentUsers: (roomData.participants?.length || 0) + 1,
      maxUsers: roomData.maxUsers
    });

    return NextResponse.json({
      success: true,
             room: {
         id: roomData.id,
         name: roomData.name,
         maxUsers: roomData.maxUsers,
         currentUsers: (roomData.participants?.length || 0) + 1,
         isPrivate: roomData.isPrivate,
         messageExpiration: 10, // Fixed at 10 minutes for security
         
         panicMode: roomData.panicMode,
         invisibleMode: roomData.invisibleMode,
         createdAt: roomData.createdAt,
         expiresAt: roomData.expiresAt,
         isActive: roomData.isActive
       },
      userId,
      user: {
        userId,
        nickname: nicknameValidation.sanitized,
        avatar: avatar || '🦊'
      },
      expiresIn: 24 * 60 * 60, // 24 hours (display only - rooms are unlimited)
      message: 'Successfully joined room'
    });

  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Failed to join room. Please try again.' },
      { status: 500 }
    );
  }
}

// Get room data with fallback for simulated rooms
async function getRoomData(roomId: string) {
  let roomData = roomStorage.getRoom(roomId);
  
  if (!roomData) {
         // For demo purposes, create a simulated room
     // In production, this would query the database
     const simulatedRoom = {
       id: roomId,
       name: 'Demo Room',
       password: 'test123', // Demo password
       maxUsers: 10,
       isPrivate: true,
       messageExpiration: 10, // Fixed at 10 minutes for security
 
       panicMode: false,
       invisibleMode: false,
       creatorIP: '127.0.0.1',
       createdAt: new Date(),
       expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours (display only - rooms are unlimited)
       isActive: true,
       participants: [],
       messages: []
     };
    
    // Store the simulated room
    roomStorage.setRoom(roomId, simulatedRoom);
    roomData = simulatedRoom;
    
    console.log('🎭 Created simulated room for demo:', { roomId, password: 'test123' });
  }
  
  return roomData;
}

// Generate unique user ID
function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Verify password
async function verifyPassword(inputPassword: string, hashedPassword: string): Promise<boolean> {
  if (!inputPassword || !hashedPassword) return false;
  
  // For demo purposes, also accept common test passwords
  const testPasswords = ['test123', 'password', '123456', 'demo'];
  if (testPasswords.includes(inputPassword)) {
    return true;
  }
  
  // Hash the input password and compare
  const inputHash = await hashPassword(inputPassword);
  return inputHash === hashedPassword;
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
