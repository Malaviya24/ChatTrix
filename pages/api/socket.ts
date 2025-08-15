import { NextApiRequest, NextApiResponse } from 'next';

// Store room participants in memory (will reset on cold starts)
const roomParticipants = new Map<string, Map<string, { nickname: string; avatar: string; joinedAt: Date }>>();
const userRooms = new Map<string, string>(); // userId -> roomId
const roomCreators = new Map<string, string>(); // roomId -> creatorUserId

// NEW: Store messages for each room
const roomMessages = new Map<string, Array<{
  id: string;
  text: string;
  userId: string;
  nickname: string;
  avatar: string;
  timestamp: Date;
  isInvisible?: boolean;
}>>();

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Health check endpoint
      return res.status(200).json({
        status: 'running',
        timestamp: new Date().toISOString(),
        message: 'Socket API server is running',
        environment: process.env.NODE_ENV || 'development',
        vercel: !!process.env.VERCEL,
        runtime: 'nodejs'
      });
    }

    if (req.method === 'POST') {
      const { action, data } = req.body;

      switch (action) {
        case 'join-room':
          return handleJoinRoom(data, res);
        case 'send-message':
          return handleSendMessage(data, res);
        case 'get-messages':
          return handleGetMessages(data, res);
        case 'typing':
          return handleTyping(data, res);
        case 'leave-room':
          return handleLeaveRoom(data, res);
        case 'kick-user':
          return handleKickUser(data, res);
        default:
          return res.status(400).json({ error: 'Unknown action' });
      }
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({
      error: 'Request processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function handleJoinRoom(data: SocketData, res: NextApiResponse) {
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
  
  return res.status(200).json({
    success: true,
    participants,
    isCreator,
    message: 'Successfully joined room'
  });
}

function handleSendMessage(data: MessageData, res: NextApiResponse) {
  const { roomId, message, userId, nickname, avatar, isInvisible } = data;
  
  const messageData = {
    id: Date.now().toString(),
    text: message,
    userId,
    nickname,
    avatar,
    timestamp: new Date(),
    isInvisible: isInvisible || false
  };
  
  // Store message in room
  if (!roomMessages.has(roomId)) {
    roomMessages.set(roomId, []);
  }
  roomMessages.get(roomId)!.push(messageData);
  
  // Keep only last 100 messages to prevent memory issues
  const messages = roomMessages.get(roomId)!;
  if (messages.length > 100) {
    roomMessages.set(roomId, messages.slice(-100));
  }
  
  return res.status(200).json({
    success: true,
    message: messageData,
    messageId: messageData.id
  });
}

function handleGetMessages(data: { roomId: string }, res: NextApiResponse) {
  const { roomId } = data;
  
  // Get messages for the room
  const messages = roomMessages.get(roomId) || [];
  
  return res.status(200).json({
    success: true,
    messages
  });
}

function handleTyping(data: TypingData, res: NextApiResponse) {
  const { userId, nickname, isTyping } = data;
  
  return res.status(200).json({
    success: true,
    typing: isTyping,
    userId,
    nickname
  });
}

function handleLeaveRoom(data: SocketData, res: NextApiResponse) {
  const { roomId, userId } = data;
  
  userRooms.delete(userId);
  
  // Remove from room participants
  const participants = roomParticipants.get(roomId);
  if (participants) {
    participants.delete(userId);
    if (participants.size === 0) {
      roomParticipants.delete(roomId);
      roomCreators.delete(roomId);
      // Clear room messages when room is empty
      roomMessages.delete(roomId);
    }
  }
  
  return res.status(200).json({
    success: true,
    message: 'Successfully left room'
  });
}

function handleKickUser(data: KickUserData, res: NextApiResponse) {
  const { roomId, targetUserId, kickedBy } = data;
  
  // Check if the user is the room creator
  const isCreator = roomCreators.get(roomId) === kickedBy;
  
  if (isCreator) {
    // Remove kicked user from room
    const participants = roomParticipants.get(roomId);
    participants?.delete(targetUserId);
    userRooms.delete(targetUserId);
    
    return res.status(200).json({
      success: true,
      message: 'User kicked successfully'
    });
  } else {
    return res.status(403).json({
      error: 'Only room creator can kick users'
    });
  }
}
