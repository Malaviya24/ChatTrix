import { NextApiRequest, NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Extend the server type to include io
interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

// Store room participants for room creator functionality
const roomParticipants = new Map<string, Map<string, { nickname: string; avatar: string; joinedAt: Date }>>();
const userRooms = new Map<string, string>(); // userId -> roomId
const roomCreators = new Map<string, string>(); // roomId -> creatorUserId
const userSockets = new Map<string, string>(); // userId -> socketId

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

interface DeleteMessageData {
  roomId: string;
  messageId: string;
  userId: string;
}

interface KickUserData {
  roomId: string;
  targetUserId: string;
  kickedBy: string;
}

// Function to initialize Socket.IO server
function initializeSocketIOServer(res: NextApiResponse) {
  const socketServer = res.socket as unknown as { server: SocketServer };
  
  if (socketServer.server.io) {
    console.log('Socket.IO server already running');
    return socketServer.server.io;
  }

  console.log('Setting up Socket.IO server...');
  
  const httpServer: NetServer = socketServer.server;
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Store the io instance on the server
  socketServer.server.io = io;

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    
    // Handle connection errors
    socket.on('error', (error) => {
      console.error('🔌 Socket error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 User disconnected:', socket.id, 'Reason:', reason);
      
      // Clean up user socket mapping
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`🧹 Cleaned up socket mapping for user ${userId}`);
          break;
        }
      }
    });

    // Join room
    socket.on('join-room', (data: SocketData) => {
      const { roomId, userId, nickname, avatar, isRoomCreator } = data;
      
      // Leave previous room if any
      const previousRoom = userRooms.get(userId);
      if (previousRoom && previousRoom !== roomId) {
        socket.leave(previousRoom);
        // Notify others in previous room
        socket.to(previousRoom).emit('user-left', {
          userId,
          nickname,
          avatar,
          timestamp: new Date()
        });
      }
      
      // Join new room
      socket.join(roomId);
      userRooms.set(userId, roomId);
      userSockets.set(userId, socket.id); // Track user's socket ID
      
      // Track room participants
      if (!roomParticipants.has(roomId)) {
        roomParticipants.set(roomId, new Map());
        // Set the first user as room creator
        roomCreators.set(roomId, userId);
      } else if (isRoomCreator && !roomCreators.has(roomId)) {
        // Restore room creator if they're rejoining and no creator is set
        roomCreators.set(roomId, userId);
        console.log(`🔄 Room creator restored: ${nickname} (${userId}) for room ${roomId}`);
      } else if (isRoomCreator && roomCreators.get(roomId) !== userId) {
        // Verify the user is actually the creator (security check)
        const currentCreator = roomCreators.get(roomId);
        if (currentCreator && currentCreator !== userId) {
          console.log(`⚠️ User ${userId} claims to be creator but room ${roomId} already has creator ${currentCreator}`);
          // Don't override existing creator, but allow them to join as regular user
        } else {
          roomCreators.set(roomId, userId);
          console.log(`🔄 Room creator restored: ${nickname} (${userId}) for room ${roomId}`);
        }
      }
      
      roomParticipants.get(roomId)!.set(userId, {
        nickname,
        avatar,
        joinedAt: new Date()
      });
      
      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        userId,
        nickname,
        avatar,
        timestamp: new Date()
      });
      
      // Send current room participants to ALL users in the room (including new user)
      const participants = Array.from(roomParticipants.get(roomId)!.entries()).map(([userId, data]) => ({
        userId,
        nickname: data.nickname,
        avatar: data.avatar
      }));
      
      // Send updated participant list to ALL users in the room
      io.to(roomId).emit('room-participants', participants);
      
      // Check if user is room creator
      const isCreator = roomCreators.get(roomId) === userId;
      socket.emit('room-creator-status', { isCreator });
      
      console.log(`👥 ${nickname} joined room ${roomId} (Creator: ${isCreator})`);
    });

    // Handle typing
    socket.on('typing', (data: TypingData) => {
      socket.to(data.roomId).emit('user-typing', {
        userId: data.userId,
        nickname: data.nickname,
        isTyping: data.isTyping
      });
    });

    // Handle messages
    socket.on('send-message', (data: MessageData) => {
      const messageData = {
        id: Date.now().toString(),
        text: data.message,
        userId: data.userId,
        nickname: data.nickname,
        avatar: data.avatar,
        timestamp: new Date(),
        isOwn: false,
        isInvisible: data.isInvisible || false
      };
      
      // Broadcast to all users in room (including sender)
      io.to(data.roomId).emit('new-message', messageData);
      console.log(`💬 Message sent in room ${data.roomId} by ${data.nickname}: ${data.message}`);
    });

    // Handle message deletion
    socket.on('delete-message', (data: DeleteMessageData) => {
      io.to(data.roomId).emit('message-deleted', {
        messageId: data.messageId,
        userId: data.userId
      });
      console.log(`🗑️ Message deleted in room ${data.roomId} by ${data.userId}`);
    });

    // Handle user leaving
    socket.on('leave-room', (data: SocketData) => {
      const { roomId, userId, nickname } = data;
      
      socket.leave(roomId);
      userRooms.delete(userId);
      userSockets.delete(userId); // Clean up socket mapping
      
      // Remove from room participants
      const participants = roomParticipants.get(roomId);
      if (participants) {
        participants.delete(userId);
        if (participants.size === 0) {
          roomParticipants.delete(roomId);
          roomCreators.delete(roomId); // Clean up room creator mapping
        }
      }
      
      // Notify others in the room
      socket.to(roomId).emit('user-left', {
        userId,
        nickname,
        avatar: data.avatar,
        timestamp: new Date()
      });
      
      // Send updated participant list to remaining users
      if (participants && participants.size > 0) {
        const updatedParticipants = Array.from(participants.entries()).map(([userId, data]) => ({
          userId,
          nickname: data.nickname,
          avatar: data.avatar
        }));
        io.to(roomId).emit('room-participants', updatedParticipants);
      }
      
      console.log(`👋 ${nickname} left room ${roomId}`);
    });

    // Handle user kicking (room creator only)
    socket.on('kick-user', (data: KickUserData) => {
      const { roomId, targetUserId, kickedBy } = data;
      
      // Check if the user is the room creator
      const isCreator = roomCreators.get(roomId) === kickedBy;
      
      if (isCreator) {
        // Get participants for this room
        const participants = roomParticipants.get(roomId);
        
        // Remove kicked user from room
        participants?.delete(targetUserId);
        userRooms.delete(targetUserId);
        
        // Get the kicked user's socket ID
        const kickedUserSocketId = userSockets.get(targetUserId);
        
        // Notify all users in the room about the kick
        io.to(roomId).emit('user-kicked', {
          kickedUserId: targetUserId,
          kickedBy,
          reason: 'Removed by room creator'
        });
        
        // Notify ONLY the kicked user specifically
        if (kickedUserSocketId) {
          io.to(kickedUserSocketId).emit('you-were-kicked', {
            reason: 'You were removed by the room creator'
          });
          // Clean up the kicked user's socket mapping
          userSockets.delete(targetUserId);
        }
        
        // Send updated participant list to remaining users
        if (participants && participants.size > 0) {
          const updatedParticipants = Array.from(participants.entries()).map(([userId, data]) => ({
            userId,
            nickname: data.nickname,
            avatar: data.avatar
          }));
          io.to(roomId).emit('room-participants', updatedParticipants);
        }
        
        console.log(`🚫 User ${targetUserId} was kicked from room ${roomId} by ${kickedBy}`);
      } else {
        console.log(`❌ User ${kickedBy} attempted to kick user ${targetUserId} but is not the room creator`);
      }
    });
  });

  console.log('Socket.IO server setup complete');
  return io;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Handle GET requests for health check
    if (req.method === 'GET') {
      const socketServer = res.socket as unknown as { server: SocketServer };
      let isRunning = !!socketServer.server.io;
      
      // If server is not running, initialize it
      if (!isRunning) {
        console.log('🔍 Health check requested, initializing Socket.IO server...');
        initializeSocketIOServer(res);
        isRunning = true;
      } else {
        console.log('🔍 Health check requested, server status:', isRunning);
      }
      
      return res.status(200).json({
        status: isRunning ? 'running' : 'not_running',
        timestamp: new Date().toISOString(),
        message: isRunning ? 'Socket.IO server is running' : 'Socket.IO server is not running'
      });
    }

    // For POST requests, ensure server is running
    const socketServer = res.socket as unknown as { server: SocketServer };
    
    if (!socketServer.server.io) {
      console.log('Initializing Socket.IO server for POST request...');
      initializeSocketIOServer(res);
    }

    res.end();
    
  } catch (error) {
    console.error('❌ Error in Socket.IO handler:', error);
    res.status(500).json({ error: 'Socket.IO server setup failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
