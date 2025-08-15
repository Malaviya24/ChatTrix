import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Store room participants in memory (will reset on cold starts)
const roomParticipants = new Map<string, Map<string, { nickname: string; avatar: string; joinedAt: Date }>>();
const userRooms = new Map<string, string>(); // userId -> roomId
const roomCreators = new Map<string, string>(); // roomId -> creatorUserId

interface SocketData {
  roomId: string;
  userId: string;
  nickname: string;
  avatar: string;
  isRoomCreator?: boolean;
}

interface MessageData {
  roomId: string;
  message: string;
  userId: string;
  nickname: string;
  avatar: string;
  isInvisible?: boolean;
}

interface TypingData {
  roomId: string;
  userId: string;
  nickname: string;
  isTyping: boolean;
}

interface KickUserData {
  roomId: string;
  targetUserId: string;
  kickedBy: string;
}

export async function GET() {
  try {
    return new Response(JSON.stringify({
      status: 'running',
      timestamp: new Date().toISOString(),
      message: 'Socket.IO server is running (Edge Runtime)',
      environment: process.env.NODE_ENV || 'development',
      vercel: !!process.env.VERCEL,
      runtime: 'edge'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Socket.IO server setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'development',
      vercel: !!process.env.VERCEL
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'join-room':
        return handleJoinRoom(data);
      case 'send-message':
        return handleSendMessage(data);
      case 'typing':
        return handleTyping(data);
      case 'leave-room':
        return handleLeaveRoom(data);
      case 'kick-user':
        return handleKickUser(data);
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Request processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function handleJoinRoom(data: SocketData) {
  const { roomId, userId, nickname, avatar, isRoomCreator } = data;
  
  // Leave previous room if any
  const previousRoom = userRooms.get(userId);
  if (previousRoom && previousRoom !== roomId) {
    userRooms.delete(userId);
  }
  
  // Join new room
  userRooms.set(userId, roomId);
  
  // Track room participants
  if (!roomParticipants.has(roomId)) {
    roomParticipants.set(roomId, new Map());
    // Set the first user as room creator
    roomCreators.set(roomId, userId);
  } else if (isRoomCreator && !roomCreators.has(roomId)) {
    // Restore room creator if they're rejoining and no creator is set
    roomCreators.set(roomId, userId);
  }
  
  roomParticipants.get(roomId)!.set(userId, {
    nickname,
    avatar,
    joinedAt: new Date()
  });
  
  // Get current participants
  const participants = Array.from(roomParticipants.get(roomId)!.entries()).map(([userId, data]) => ({
    userId,
    nickname: data.nickname,
    avatar: data.avatar
  }));
  
  // Check if user is room creator
  const isCreator = roomCreators.get(roomId) === userId;
  
  return new Response(JSON.stringify({
    success: true,
    participants,
    isCreator,
    message: 'Successfully joined room'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

function handleSendMessage(data: MessageData) {
  const { message, userId, nickname, avatar, isInvisible } = data;
  
  const messageData = {
    id: Date.now().toString(),
    text: message,
    userId,
    nickname,
    avatar,
    timestamp: new Date(),
    isOwn: false,
    isInvisible: isInvisible || false
  };
  
  return new Response(JSON.stringify({
    success: true,
    message: messageData,
    messageId: messageData.id
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

function handleTyping(data: TypingData) {
  const { userId, nickname, isTyping } = data;
  
  return new Response(JSON.stringify({
    success: true,
    typing: isTyping,
    userId,
    nickname
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

function handleLeaveRoom(data: SocketData) {
  const { roomId, userId } = data;
  
  userRooms.delete(userId);
  
  // Remove from room participants
  const participants = roomParticipants.get(roomId);
  if (participants) {
    participants.delete(userId);
    if (participants.size === 0) {
      roomParticipants.delete(roomId);
      roomCreators.delete(roomId);
    }
  }
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Successfully left room'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

function handleKickUser(data: KickUserData) {
  const { roomId, targetUserId, kickedBy } = data;
  
  // Check if the user is the room creator
  const isCreator = roomCreators.get(roomId) === kickedBy;
  
  if (isCreator) {
    // Remove kicked user from room
    const participants = roomParticipants.get(roomId);
    participants?.delete(targetUserId);
    userRooms.delete(targetUserId);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'User kicked successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    return new Response(JSON.stringify({
      error: 'Only room creator can kick users'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
