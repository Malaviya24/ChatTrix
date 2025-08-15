import { NextApiRequest, NextApiResponse } from 'next';
import { redisStore } from '../../src/lib/redisStore';
import { 
  SocketDataSchema, 
  MessageDataSchema, 
  TypingDataSchema, 
  KickUserDataSchema, 
  GetMessagesDataSchema,
  type SocketData,
  type MessageData,
  type TypingData,
  type KickUserData,
  type GetMessagesData
} from '../../src/lib/validation';
import { z } from 'zod';

// Utility function to redact sensitive fields from data
function redactSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const redacted = { ...data };
  
  // Redact sensitive fields
  if ('message' in redacted) {
    redacted.message = '[REDACTED]';
  }
  if ('nickname' in redacted) {
    redacted.nickname = '[REDACTED]';
  }
  if ('userId' in redacted) {
    redacted.userId = '[REDACTED]';
  }
  if ('targetUserId' in redacted) {
    redacted.targetUserId = '[REDACTED]';
  }
  if ('kickedBy' in redacted) {
    redacted.kickedBy = '[REDACTED]';
  }
  
  return redacted;
}

// Utility function for environment-gated logging
function logDebug(message: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}

function logProduction(message: string, metadata?: Record<string, any>) {
  // Production logging - minimal context, no sensitive data
  const logData = {
    timestamp: new Date().toISOString(),
    message,
    ...metadata
  };
  console.log('🔍 Socket API:', JSON.stringify(logData));
}

// Helper function to create consistent error responses for Pages Router
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

// Helper function to create consistent success responses for Pages Router
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
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).end();
  }

  // Log incoming request for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔍 API Request: ${req.method} ${req.url}`);
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
        if (process.env.NODE_ENV === 'production') {
          logProduction('JSON parse error', { 
            hasMessage: parseError instanceof Error && !!parseError.message,
            errorType: parseError instanceof Error ? parseError.constructor.name : 'Unknown'
          });
        } else {
          console.error('❌ JSON parse error:', parseError);
        }
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
      const allowedActions = ['join-room', 'send-message', 'get-messages', 'typing', 'leave-room', 'kick-user', 'get-typing-status'];
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
      
      // Environment-gated logging with redacted sensitive data
      if (process.env.NODE_ENV === 'production') {
        logProduction('Action received', { action, dataSize: JSON.stringify(data).length });
      } else {
        logDebug('🔍 Socket API - Action:', action);
        logDebug('🔍 Socket API - Raw Data (REDACTED):', redactSensitiveData(data));
      }
      
      try {
        switch (action) {
          case 'join-room':
            validatedData = SocketDataSchema.parse(data);
            break;
            
          case 'send-message':
            validatedData = MessageDataSchema.parse(data);
            break;
            
          case 'get-messages':
            validatedData = GetMessagesDataSchema.parse(data);
            break;
            
          case 'typing':
            validatedData = TypingDataSchema.parse(data);
            break;
            
          case 'leave-room':
            validatedData = SocketDataSchema.parse(data);
            break;
            
          case 'kick-user':
            validatedData = KickUserDataSchema.parse(data);
            break;
            
          case 'get-typing-status':
            validatedData = GetMessagesDataSchema.parse(data);
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
        if (validationError instanceof z.ZodError) {
          if (process.env.NODE_ENV === 'production') {
            logProduction('Action data validation failed', { 
              action, 
              errorCount: validationError.issues.length,
              firstError: validationError.issues[0]?.message 
            });
          } else {
            console.error('❌ Action data validation failed:', validationError.issues);
          }
          return createErrorResponse(
            res,
            400,
            'Data validation failed',
            `Invalid data format for action '${action}': ${validationError.issues.map(e => e.message).join(', ')}`
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
        // Check Redis connection before processing
        const redisHealth = await redisStore.healthCheck();
        if (redisHealth.status !== 'healthy' && process.env.NODE_ENV !== 'production') {
          console.warn(`⚠️ Redis status: ${redisHealth.status} - ${redisHealth.details}`);
        }

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
          case 'get-typing-status':
            return await handleGetTypingStatus(validatedData as GetMessagesData, res);
          default:
            return createErrorResponse(
              res,
              400,
              'Unknown action',
              `Action '${action}' is not supported`
            );
        }
      } catch (actionError) {
        if (process.env.NODE_ENV === 'production') {
          logProduction('Action processing failed', { 
            action, 
            errorType: actionError instanceof Error ? actionError.constructor.name : 'Unknown',
            hasMessage: actionError instanceof Error && !!actionError.message
          });
        } else {
          console.error(`❌ Error processing action '${action}':`, actionError);
        }
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
    // Extract error information for logging and response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    if (process.env.NODE_ENV === 'production') {
      logProduction('API Error occurred', { 
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        hasMessage: error instanceof Error && !!error.message,
        url: req.url,
        method: req.method
      });
    } else {
      console.error('❌ API Error:', error);
      
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
    }
    
    // Use the consistent error response helper function
    return createErrorResponse(
      res,
      500,
      'Request processing failed',
      process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
    );
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
      try {
        // First remove user from room participants, then remove user-room mapping
        await redisStore.removeRoomParticipant(previousRoom, userId);
        await redisStore.removeUserRoom(userId);
              } catch (error) {
          if (process.env.NODE_ENV === 'production') {
            logProduction('Error leaving previous room', { 
              hasMessage: error instanceof Error && !!error.message,
              errorType: error instanceof Error ? error.constructor.name : 'Unknown'
            });
          } else {
            console.error('❌ Error leaving previous room:', error);
          }
          // Try to rollback: re-add user-room mapping if participant removal succeeded but user-room removal failed
          try {
            const isStillParticipant = await redisStore.hasRoomParticipant(previousRoom, userId);
            if (isStillParticipant) {
              await redisStore.setUserRoom(userId, previousRoom);
            }
          } catch (rollbackError) {
            if (process.env.NODE_ENV === 'production') {
              logProduction('Rollback failed', { 
                hasMessage: rollbackError instanceof Error && !!rollbackError.message,
                errorType: rollbackError instanceof Error ? rollbackError.constructor.name : 'Unknown'
              });
            } else {
              console.error('❌ Rollback failed:', rollbackError);
            }
          }
        // Continue with join operation even if cleanup failed
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
    if (process.env.NODE_ENV === 'production') {
      logProduction('handleJoinRoom error', { 
        hasMessage: error instanceof Error && !!error.message,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      });
    } else {
      console.error('❌ handleJoinRoom error:', error);
    }
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
    if (process.env.NODE_ENV === 'production') {
      logProduction('handleSendMessage error', { 
        hasMessage: error instanceof Error && !!error.message,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      });
    } else {
      console.error('❌ handleSendMessage error:', error);
    }
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
    if (process.env.NODE_ENV === 'production') {
      logProduction('handleGetMessages error', { 
        hasMessage: error instanceof Error && !!error.message,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      });
    } else {
      console.error('❌ handleGetMessages error:', error);
    }
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
    
    // Store typing status in Redis
    await redisStore.setUserTypingStatus(roomId, userId, nickname, isTyping);
    
    // Get current typing users (excluding the current user)
    const typingUsers = await redisStore.getRoomTypingUsers(roomId, userId);
    
    return createSuccessResponse(res, {
      success: true,
      typing: isTyping,
      userId,
      nickname,
      typingUsers // Return other users who are typing
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      logProduction('handleTyping error', { 
        hasMessage: error instanceof Error && !!error.message,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      });
    } else {
      console.error('❌ handleTyping error:', error);
    }
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
    
    // Use atomic cleanup to check if room is empty and clean up if needed
    await redisStore.cleanupEmptyRoom(roomId);
    
    return createSuccessResponse(res, {
      success: true,
      message: 'Successfully left room'
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      logProduction('handleLeaveRoom error', { 
        hasMessage: error instanceof Error && !!error.message,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      });
    } else {
      console.error('❌ handleLeaveRoom error:', error);
    }
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
    try {
      // First remove user-room mapping, then remove from room participants
      await redisStore.removeUserRoom(targetUserId);
      await redisStore.removeRoomParticipant(roomId, targetUserId);
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        logProduction('Error kicking user', { 
          hasMessage: error instanceof Error && !!error.message,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown'
        });
      } else {
        console.error('❌ Error kicking user:', error);
      }
      // Try to rollback: re-add user-room mapping if user-room removal succeeded but participant removal failed
      try {
        const userRoom = await redisStore.getUserRoom(targetUserId);
        if (!userRoom) {
          // User-room mapping was removed, try to restore it
          await redisStore.setUserRoom(targetUserId, roomId);
        }
      } catch (rollbackError) {
        if (process.env.NODE_ENV === 'production') {
          logProduction('Rollback failed', { 
            hasMessage: rollbackError instanceof Error && !!rollbackError.message,
            errorType: rollbackError instanceof Error ? rollbackError.constructor.name : 'Unknown'
          });
        } else {
          console.error('❌ Rollback failed:', rollbackError);
        }
      }
      throw error; // Re-throw to trigger error response
    }
    
    return createSuccessResponse(res, {
      success: true,
      message: 'User kicked successfully'
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      logProduction('handleKickUser error', { 
        hasMessage: error instanceof Error && !!error.message,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      });
    } else {
      console.error('❌ handleKickUser error:', error);
    }
    return createErrorResponse(
      res,
      500,
      'Failed to kick user',
      process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    );
  }
}

async function handleGetTypingStatus(data: GetMessagesData, res: NextApiResponse) {
  try {
    const { roomId } = data;

    // Validate that the room exists
    const participants = await redisStore.getRoomParticipants(roomId);
    if (participants.size === 0) {
      return createErrorResponse(
        res,
        404,
        'Room not found',
        'The specified room does not exist'
      );
    }

    // Get the typing status for the room
    const typingStatus = await redisStore.getRoomTypingUsers(roomId);

    return createSuccessResponse(res, {
      success: true,
      typingStatus
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      logProduction('handleGetTypingStatus error', { 
        hasMessage: error instanceof Error && !!error.message,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      });
    } else {
      console.error('❌ handleGetTypingStatus error:', error);
    }
    return createErrorResponse(
      res,
      500,
      'Failed to get typing status',
      process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    );
  }
}
