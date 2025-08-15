import { z } from 'zod';

// Base validation schemas
export const ActionSchema = z.enum([
  'join-room',
  'send-message',
  'get-messages',
  'typing',
  'leave-room',
  'kick-user'
]);

export const SocketDataSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required').max(100, 'Room ID too long'),
  userId: z.string().min(1, 'User ID is required').max(100, 'User ID too long'),
  nickname: z.string().min(1, 'Nickname is required').max(50, 'Nickname too long').regex(/^[a-zA-Z0-9\s\-_]+$/, 'Nickname contains invalid characters'),
  avatar: z.string().min(1, 'Avatar is required').max(500, 'Avatar URL too long').url('Invalid avatar URL'),
  isRoomCreator: z.boolean().optional()
});

export const MessageDataSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required').max(100, 'Room ID too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  userId: z.string().min(1, 'User ID is required').max(100, 'User ID too long'),
  nickname: z.string().min(1, 'Nickname is required').max(50, 'Nickname too long'),
  avatar: z.string().min(1, 'Avatar is required').max(500, 'Avatar URL too long').url('Invalid avatar URL'),
  isInvisible: z.boolean().optional()
});

export const TypingDataSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required').max(100, 'Room ID too long'),
  userId: z.string().min(1, 'User ID is required').max(100, 'User ID too long'),
  nickname: z.string().min(1, 'Nickname is required').max(50, 'Nickname too long'),
  isTyping: z.boolean()
});

export const KickUserDataSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required').max(100, 'Room ID too long'),
  targetUserId: z.string().min(1, 'Target user ID is required').max(100, 'Target user ID too long'),
  kickedBy: z.string().min(1, 'Kicker user ID is required').max(100, 'Kicker user ID too long')
});

export const GetMessagesDataSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required').max(100, 'Room ID too long')
});

// Request body validation schema
export const RequestBodySchema = z.object({
  action: ActionSchema,
  data: z.union([
    SocketDataSchema,
    MessageDataSchema,
    TypingDataSchema,
    KickUserDataSchema,
    GetMessagesDataSchema
  ])
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  env: z.string()
});

export type Action = z.infer<typeof ActionSchema>;
export type SocketData = z.infer<typeof SocketDataSchema>;
export type MessageData = z.infer<typeof MessageDataSchema>;
export type TypingData = z.infer<typeof TypingDataSchema>;
export type KickUserData = z.infer<typeof KickUserDataSchema>;
export type GetMessagesData = z.infer<typeof GetMessagesDataSchema>;
export type RequestBody = z.infer<typeof RequestBodySchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Helper function to create error responses
export function createErrorResponse(
  error: string,
  details?: string,
  status: number = 400
): Response {
  const errorResponse: ErrorResponse = {
    error,
    details,
    env: process.env.NODE_ENV || 'unknown'
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// Helper function to create success responses
export function createSuccessResponse(
  data: Record<string, unknown>,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
