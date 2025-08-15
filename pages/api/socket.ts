import { NextApiRequest, NextApiResponse } from 'next';
import { redisStore } from '../../src/lib/redisStore';
import { 
  RequestBodySchema, 
  SocketDataSchema, 
  MessageDataSchema, 
  TypingDataSchema, 
  KickUserDataSchema, 
  GetMessagesDataSchema,
  ActionSchema,
  type SocketData,
  type MessageData,
  type TypingData,
  type KickUserData,
  type GetMessagesData
} from '../../src/lib/validation';
import { z } from 'zod';

// Helper function to create consistent error responses
function createErrorResponse(
  res: NextApiResponse,
  status: number,
  error: string,
  details?: string
) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json({
    error,
    details,
    env: process.env.NODE_ENV || 'unknown'
  });
}

// Helper function to create consistent success responses
function createSuccessResponse(
  res: NextApiResponse,
  data: Record<string, unknown>,
  status: number = 200
) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(data);
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
      // Health check endpoint with Redis status
      const redisHealth = await redisStore.healthCheck();
      
      return createSuccessResponse(res, {
        status: 'running',
        timestamp: new Date().toISOString(),
        message: 'Socket API server is running',
        environment: process.env.NODE_ENV || 'development',
        vercel: !!process.env.VERCEL,
        runtime: 'nodejs',
        redis: redisHealth
      });
    }

    if (req.method === 'POST') {
      // Validate request body exists
      if (!req.body) {
        return createErrorResponse(
          res,
          400,
          'Missing request body',
          'Request body is required for POST requests'
        );
      }

      // Validate request body is valid JSON
      let parsedBody;
      try {
        // Ensure body is parsed as JSON
        parsedBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        return createErrorResponse(
          res,
          400,
          'Invalid JSON in request body',
          'Request body must be valid JSON'
        );
      }

      // Validate that action field exists and is a string
      if (!parsedBody || typeof parsedBody !== 'object') {
        return createErrorResponse(
          res,
          400,
          'Invalid request format',
          'Request body must be a valid JSON object'
        );
      }

      if (!parsedBody.action || typeof parsedBody.action !== 'string') {
        return createErrorResponse(
          res,
          400,
          'Missing or invalid action',
          'Action field is required and must be a string'
        );
      }

      // Validate that action is one of the allowed actions
      const allowedActions = ['join-room', 'send-message', 'get-messages', 'typing', 'leave-room', 'kick-user'];
      if (!allowedActions.includes(parsedBody.action)) {
        return createErrorResponse(
          res,
          400,
          'Invalid action',
          `Action '${parsedBody.action}' is not supported. Allowed actions: ${allowedActions.join(', ')}`
        );
      }

      // Validate that data field exists
      if (!parsedBody.data || typeof parsedBody.data !== 'object') {
        return createErrorResponse(
          res,
          400,
          'Missing or invalid data',
          'Data field is required and must be a valid object'
        );
      }

      // Validate action-specific data payload shape
      const { action, data } = parsedBody;
      let validatedData;
      
      try {
        switch (action) {
          case 'join-room':
            // Validate required fields: roomId, userId, nickname, avatar
            if (!data.roomId || !data.userId || !data.nickname || !data.avatar) {
              return createErrorResponse(
                res,
                400,
                'Missing required fields for join-room',
                'roomId, userId, nickname, and avatar are required'
              );
            }
            validatedData = SocketDataSchema.parse(data);
            break;
            
          case 'send-message':
            // Validate required fields: roomId, userId, message, nickname, avatar
            if (!data.roomId || !data.userId || !data.message || !data.nickname || !data.avatar) {
              return createErrorResponse(
                res,
                400,
                'Missing required fields for send-message',
                'roomId, userId, message, nickname, and avatar are required'
              );
            }
            validatedData = MessageDataSchema.parse(data);
            break;
            
          case 'get-messages':
            // Validate required field: roomId
            if (!data.roomId) {
              return createErrorResponse(
                res,
                400,
                'Missing required field for get-messages',
                'roomId is required'
              );
            }
            validatedData = GetMessagesDataSchema.parse(data);
            break;
            
          case 'typing':
            // Validate required fields: roomId, userId, nickname, isTyping
            if (!data.roomId || !data.userId || !data.nickname || typeof data.isTyping !== 'boolean') {
              return createErrorResponse(
                res,
                400,
                'Missing or invalid required fields for typing',
                'roomId, userId, nickname, and isTyping (boolean) are required'
              );
            }
            validatedData = TypingDataSchema.parse(data);
            break;
            
          case 'leave-room':
            // Validate required fields: roomId, userId
            if (!data.roomId || !data.userId) {
              return createErrorResponse(
                res,
                400,
                'Missing required fields for leave-room',
                'roomId and userId are required'
              );
            }
            validatedData = SocketDataSchema.parse(data);
            break;
            
          case 'kick-user':
            // Validate required fields: roomId, targetUserId, kickedBy
            if (!data.roomId || !data.targetUserId || !data.kickedBy) {
              return createErrorResponse(
                res,
                400,
                'Missing required fields for kick-user',
                'roomId, targetUserId, and kickedBy are required'
              );
            }
            validatedData = KickUserDataSchema.parse(data);
            break;
            
          default:
            return createErrorResponse(
              res,
              400,
              'Unknown action',
              `Action '${action}' is not supported`
            );
        }
      } catch (validationError) {
        if (validationError instanceof Error) {
          console.error('❌ Action data validation failed:', validationError.message);
          return createErrorResponse(
            res,
            400,
            'Data validation failed',
            `Invalid data format for action '${action}': ${validationError.message}`
          );
        }
        return createErrorResponse(
          res,
          400,
          'Data validation failed',
          `Invalid data format for action '${action}'`
        );
      }

      // Process the validated request
      try {
        switch (action) {
          case 'join-room':
            return await handleJoinRoom(validatedData as SocketData, res);
          case 'send-message':
            return await handleSendMessage(validatedData as MessageData, res);
          case 'get-messages':
            return await handleGetMessages(validatedData as GetMessagesData, res);
          case 'typing':
            return await handleTyping(validatedData as TypingData, res);
          case 'leave-room':
            return await handleLeaveRoom(validatedData as SocketData, res);
          case 'kick-user':
            return await handleKickUser(validatedData as KickUserData, res);
          default:
            return createErrorResponse(
              res,
              400,
              'Unknown action',
              `Action '${action}' is not supported`
            );
        }
      } catch (actionError) {
        console.error(`❌ Error processing action '${action}':`, actionError);
        return createErrorResponse(
          res,
          500,
          'Action processing failed',
          process.env.NODE_ENV === 'development' 
            ? (actionError instanceof Error ? actionError.message : 'Unknown error')
            : 'Internal server error'
        );
      }
    }

    // Method not allowed
    return createErrorResponse(
      res,
      405,
      'Method not allowed',
      `HTTP method '${req.method}' is not supported`
    );
    
  } catch (error) {
    console.error('❌ API Error:', error);
    
    // Log the full error for debugging but don't expose sensitive details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    // Enhanced server-side logging with structured error information
    console.error(`❌ Error Details:`, {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      url: req.url,
      method: req.method,
      userAgent: req.headers['user-agent'] || 'unknown'
    });
    
    // Ensure internal errors are logged server-side but not leaked to client
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error stack:', errorStack);
      console.error('Request details:', {
        body: req.body,
        headers: req.headers,
        query: req.query
      });
    }
    
    // Create consistent error response with environment info
    const errorResponse = {
      error: 'Request processing failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
      env: process.env.NODE_ENV || 'unknown'
    };
    
    // Set proper headers and return error response
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json(errorResponse);
  }
}

async function handleJoinRoom(data: SocketData, res: NextApiResponse) {
  try {
    const { roomId, userId, nickname, avatar, isRoomCreator } = data;
    
    // Note: Basic validation is already done by the schema
    // Additional business logic validation can be added here if needed

    // Leave previous room if any
    const previousRoom = await redisStore.getUserRoom(userId);
    if (previousRoom && previousRoom !== roomId) {
      await redisStore.removeUserRoom(userId);
      if (previousRoom) {
        await redisStore.removeRoomParticipant(previousRoom, userId);
      }
    }
    
    // Create participant object
    const participant = {
      nickname,
      avatar,
      joinedAt: new Date().toISOString(),
      isRoomCreator: isRoomCreator || false
    };

    // Join new room using atomic operation
    await redisStore.joinRoom(userId, roomId, participant);
    
    // Set room creator if this is the first user or if explicitly specified
    const existingCreator = await redisStore.getRoomCreator(roomId);
    if (!existingCreator) {
      await redisStore.setRoomCreator(roomId, userId);
    } else if (isRoomCreator && existingCreator === userId) {
      // Only allow creator to be set if the existing creator equals the requesting user
      // This prevents unauthorized takeovers while allowing the actual creator to rejoin
      await redisStore.setRoomCreator(roomId, userId);
    }
    
    // Get current participants
    const participantsMap = await redisStore.getRoomParticipants(roomId);
    const participants = Array.from(participantsMap.entries()).map(([userId, data]) => ({
      userId,
      nickname: data.nickname,
      avatar: data.avatar
    }));
    
    // Check if user is room creator
    const isCreator = await redisStore.getRoomCreator(roomId) === userId;
    
    return createSuccessResponse(res, {
      success: true,
      participants,
      isCreator,
      message: 'Successfully joined room'
    });
  } catch (error) {
    console.error('❌ handleJoinRoom error:', error);
    return createErrorResponse(
      res,
      500,
      'Failed to join room',
      process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    );
  }
}

async function handleSendMessage(data: MessageData, res: NextApiResponse) {
  try {
    const { roomId, message, userId, nickname, avatar, isInvisible } = data;
    
    // Note: Basic validation is already done by the schema
    // Additional business logic validation can be added here if needed

    // Verify user is in the room
    const isParticipant = await redisStore.hasRoomParticipant(roomId, userId);
    if (!isParticipant) {
      return createErrorResponse(
        res,
        403,
        'User not in room',
        'Only room participants can send messages'
      );
    }
    
    const messageData = {
      id: Date.now().toString(),
      text: message,
      userId,
      nickname,
      avatar,
      timestamp: new Date().toISOString(),
      isInvisible: isInvisible || false
    };
    
    // Store message in room
    await redisStore.addRoomMessage(roomId, messageData);
    
    return createSuccessResponse(res, {
      success: true,
      message: messageData,
      messageId: messageData.id
    });
  } catch (error) {
    console.error('❌ handleSendMessage error:', error);
    return createErrorResponse(
      res,
      500,
      'Failed to send message',
      process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    );
  }
}

async function handleGetMessages(data: GetMessagesData, res: NextApiResponse) {
  try {
    const { roomId } = data;
    
    // Note: Basic validation is already done by the schema
    
    // Get messages for the room
    const messages = await redisStore.getRoomMessages(roomId);
    
    return createSuccessResponse(res, {
      success: true,
      messages
    });
  } catch (error) {
    console.error('❌ handleGetMessages error:', error);
    return createErrorResponse(
      res,
      500,
      'Failed to get messages',
      process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    );
  }
}

async function handleTyping(data: TypingData, res: NextApiResponse) {
  try {
    const { roomId, userId, nickname, isTyping } = data;
    
    // Validate that the user is a member of the target room
    const isParticipant = await redisStore.hasRoomParticipant(roomId, userId);
    if (!isParticipant) {
      return createErrorResponse(
        res,
        403,
        'Forbidden',
        'User is not a member of this room'
      );
    }
    
    return createSuccessResponse(res, {
      success: true,
      typing: isTyping,
      userId,
      nickname
    });
  } catch (error) {
    console.error('❌ handleTyping error:', error);
    return createErrorResponse(
      res,
      500,
      'Failed to handle typing',
      process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    );
  }
}

async function handleLeaveRoom(data: SocketData, res: NextApiResponse) {
  try {
    const { roomId, userId } = data;
    
    // Note: Basic validation is already done by the schema

    // Verify user is in the room
    const isParticipant = await redisStore.hasRoomParticipant(roomId, userId);
    if (!isParticipant) {
      return createErrorResponse(
        res,
        404,
        'User not found in room',
        'User is not a participant in this room'
      );
    }

    // Leave room using atomic operation
    await redisStore.leaveRoom(userId, roomId);
    
    // Check if room is now empty and clean up if needed
    const remainingParticipants = await redisStore.getRoomParticipants(roomId);
    if (remainingParticipants.size === 0) {
      await redisStore.removeRoomCreator(roomId);
      await redisStore.clearRoomMessages(roomId);
    }
    
    return createSuccessResponse(res, {
      success: true,
      message: 'Successfully left room'
    });
  } catch (error) {
    console.error('❌ handleLeaveRoom error:', error);
    return createErrorResponse(
      res,
      500,
      'Failed to leave room',
      process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    );
  }
}

async function handleKickUser(data: KickUserData, res: NextApiResponse) {
  try {
    const { roomId, targetUserId, kickedBy } = data;
    
    // Note: Basic validation is already done by the schema

    // Verify the room exists
    const participants = await redisStore.getRoomParticipants(roomId);
    if (participants.size === 0) {
      return createErrorResponse(
        res,
        404,
        'Room not found',
        'The specified room does not exist'
      );
    }

    // Verify the target user is a member of the room
    const targetIsParticipant = await redisStore.hasRoomParticipant(roomId, targetUserId);
    if (!targetIsParticipant) {
      return createErrorResponse(
        res,
        404,
        'Target user not found',
        'The target user is not a participant in this room'
      );
    }

    // Verify the user performing the kick is the room creator
    const roomCreator = await redisStore.getRoomCreator(roomId);
    if (!roomCreator || roomCreator !== kickedBy) {
      return createErrorResponse(
        res,
        403,
        'Forbidden',
        'Only the room creator can kick users'
      );
    }

    // Prevent kicking yourself
    if (targetUserId === kickedBy) {
      return createErrorResponse(
        res,
        400,
        'Cannot kick yourself',
        'Room creator cannot kick themselves'
      );
    }

    // Remove kicked user from room
    await redisStore.removeRoomParticipant(roomId, targetUserId);
    await redisStore.removeUserRoom(targetUserId);
    
    return createSuccessResponse(res, {
      success: true,
      message: 'User kicked successfully'
    });
  } catch (error) {
    console.error('❌ handleKickUser error:', error);
    return createErrorResponse(
      res,
      500,
      'Failed to kick user',
      process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    );
  }
}
