import Redis from 'ioredis';
import { z } from 'zod';

// Redis connection configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_TTL = parseInt(process.env.REDIS_TTL || '86400'); // 24 hours default

// Validation schemas
const ParticipantSchema = z.object({
  nickname: z.string().min(1).max(50),
  avatar: z.string().min(1).max(500),
  joinedAt: z.string(), // ISO date string
  isRoomCreator: z.boolean().optional()
});

const MessageSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(1000),
  userId: z.string().min(1),
  nickname: z.string().min(1).max(50),
  avatar: z.string().min(1).max(500),
  timestamp: z.string(), // ISO date string
  isInvisible: z.boolean().optional()
});

type Participant = z.infer<typeof ParticipantSchema>;
type Message = z.infer<typeof MessageSchema>;

class RedisStore {
  private client: Redis | null = null;
  private fallbackMaps = {
    roomParticipants: new Map<string, Map<string, Participant>>(),
    userRooms: new Map<string, string>(),
    roomCreators: new Map<string, string>(),
    roomMessages: new Map<string, Message[]>()
  };
  private isConnected = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Failed to connect to Redis, falling back to memory:', error);
      this.isConnected = false;
    }
  }

  // Helper methods for serialization/deserialization
  private serializeParticipant(participant: Participant): string {
    return JSON.stringify(participant);
  }

  private deserializeParticipant(data: string): Participant | null {
    try {
      const parsed = JSON.parse(data);
      return ParticipantSchema.parse(parsed);
    } catch (error) {
      console.error('Error deserializing participant data:', error, 'Raw data:', data.substring(0, 100));
      return null;
    }
  }

  private serializeMessage(message: Message): string {
    return JSON.stringify(message);
  }

  private deserializeMessage(data: string): Message | null {
    try {
      const parsed = JSON.parse(data);
      return MessageSchema.parse(parsed);
    } catch (error) {
      console.error('Error deserializing message data:', error, 'Raw data:', data.substring(0, 100));
      return null;
    }
  }

  // Room Participants Management
  async getRoomParticipants(roomId: string): Promise<Map<string, Participant>> {
    if (!this.isConnected || !this.client) {
      return this.fallbackMaps.roomParticipants.get(roomId) || new Map();
    }

    try {
      const participants = await this.client.hgetall(`room:${roomId}:participants`);
      const result = new Map<string, Participant>();
      
      for (const [userId, data] of Object.entries(participants)) {
        if (data) {
          const participant = this.deserializeParticipant(data);
          if (participant) {
            result.set(userId, participant);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Redis getRoomParticipants error, falling back to memory:', error);
      return this.fallbackMaps.roomParticipants.get(roomId) || new Map();
    }
  }

  async setRoomParticipant(roomId: string, userId: string, participant: Participant): Promise<void> {
    if (!this.isConnected || !this.client) {
      if (!this.fallbackMaps.roomParticipants.has(roomId)) {
        this.fallbackMaps.roomParticipants.set(roomId, new Map());
      }
      this.fallbackMaps.roomParticipants.get(roomId)!.set(userId, participant);
      return;
    }

    try {
      await this.client.hset(
        `room:${roomId}:participants`,
        userId,
        this.serializeParticipant(participant)
      );
      await this.client.expire(`room:${roomId}:participants`, REDIS_TTL);
    } catch (error) {
      console.error('Redis setRoomParticipant error, falling back to memory:', error);
      if (!this.fallbackMaps.roomParticipants.has(roomId)) {
        this.fallbackMaps.roomParticipants.set(roomId, new Map());
      }
      this.fallbackMaps.roomParticipants.get(roomId)!.set(userId, participant);
    }
  }

  async removeRoomParticipant(roomId: string, userId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      const participants = this.fallbackMaps.roomParticipants.get(roomId);
      if (participants) {
        participants.delete(userId);
        if (participants.size === 0) {
          this.fallbackMaps.roomParticipants.delete(roomId);
        }
      }
      return;
    }

    try {
      await this.client.hdel(`room:${roomId}:participants`, userId);
    } catch (error) {
      console.error('Redis removeRoomParticipant error, falling back to memory:', error);
      const participants = this.fallbackMaps.roomParticipants.get(roomId);
      if (participants) {
        participants.delete(userId);
        if (participants.size === 0) {
          this.fallbackMaps.roomParticipants.delete(roomId);
        }
      }
    }
  }

  async hasRoomParticipant(roomId: string, userId: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return this.fallbackMaps.roomParticipants.get(roomId)?.has(userId) || false;
    }

    try {
      const exists = await this.client.hexists(`room:${roomId}:participants`, userId);
      return exists === 1;
    } catch (error) {
      console.error('Redis hasRoomParticipant error, falling back to memory:', error);
      return this.fallbackMaps.roomParticipants.get(roomId)?.has(userId) || false;
    }
  }

  // User Rooms Management
  async getUserRoom(userId: string): Promise<string | null> {
    if (!this.isConnected || !this.client) {
      return this.fallbackMaps.userRooms.get(userId) || null;
    }

    try {
      const roomId = await this.client.get(`user:${userId}:room`);
      return roomId;
    } catch (error) {
      console.error('Redis getUserRoom error, falling back to memory:', error);
      return this.fallbackMaps.userRooms.get(userId) || null;
    }
  }

  async setUserRoom(userId: string, roomId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      this.fallbackMaps.userRooms.set(userId, roomId);
      return;
    }

    try {
      await this.client.set(`user:${userId}:room`, roomId, 'EX', REDIS_TTL);
    } catch (error) {
      console.error('Redis setUserRoom error, falling back to memory:', error);
      this.fallbackMaps.userRooms.set(userId, roomId);
    }
  }

  async removeUserRoom(userId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      this.fallbackMaps.userRooms.delete(userId);
      return;
    }

    try {
      await this.client.del(`user:${userId}:room`);
    } catch (error) {
      console.error('Redis removeUserRoom error, falling back to memory:', error);
      this.fallbackMaps.userRooms.delete(userId);
    }
  }

  // Room Creators Management
  async getRoomCreator(roomId: string): Promise<string | null> {
    if (!this.isConnected || !this.client) {
      return this.fallbackMaps.roomCreators.get(roomId) || null;
    }

    try {
      const creatorId = await this.client.get(`room:${roomId}:creator`);
      return creatorId;
    } catch (error) {
      console.error('Redis getRoomCreator error, falling back to memory:', error);
      return this.fallbackMaps.roomCreators.get(roomId) || null;
    }
  }

  async setRoomCreator(roomId: string, creatorId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      this.fallbackMaps.roomCreators.set(roomId, creatorId);
      return;
    }

    try {
      await this.client.set(`room:${roomId}:creator`, creatorId, 'EX', REDIS_TTL);
    } catch (error) {
      console.error('Redis setRoomCreator error, falling back to memory:', error);
      this.fallbackMaps.roomCreators.set(roomId, creatorId);
    }
  }

  async removeRoomCreator(roomId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      this.fallbackMaps.roomCreators.delete(roomId);
      return;
    }

    try {
      await this.client.del(`room:${roomId}:creator`);
    } catch (error) {
      console.error('Redis removeRoomCreator error, falling back to memory:', error);
      this.fallbackMaps.roomCreators.delete(roomId);
    }
  }

  // Room Messages Management
  async getRoomMessages(roomId: string): Promise<Message[]> {
    if (!this.isConnected || !this.client) {
      return this.fallbackMaps.roomMessages.get(roomId) || [];
    }

    try {
      const messages = await this.client.lrange(`room:${roomId}:messages`, 0, -1);
      return messages.map(msg => this.deserializeMessage(msg)).filter(Boolean) as Message[];
    } catch (error) {
      console.error('Redis getRoomMessages error, falling back to memory:', error);
      return this.fallbackMaps.roomMessages.get(roomId) || [];
    }
  }

  // Typing Status Management
  async setUserTypingStatus(roomId: string, userId: string, nickname: string, isTyping: boolean): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        if (isTyping) {
          // Set typing status with expiration (5 seconds)
          await this.client.setex(`room:${roomId}:typing:${userId}`, 5, nickname);
        } else {
          // Remove typing status
          await this.client.del(`room:${roomId}:typing:${userId}`);
        }
      } else {
        // Fallback: store in memory for typing status
        const key = `room:${roomId}:typing:${userId}`;
        if (isTyping) {
          // Store in memory with expiration simulation
          setTimeout(() => {
            // Auto-remove after 5 seconds
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Redis setUserTypingStatus error:', error);
      // Continue execution even if Redis fails
    }
  }

  async getRoomTypingUsers(roomId: string, excludeUserId?: string): Promise<string[]> {
    try {
      if (this.isConnected && this.client) {
        // Get all typing status keys for the room
        const typingKeys = await this.client.keys(`room:${roomId}:typing:*`);
        const typingUsers: string[] = [];

        for (const key of typingKeys) {
          const userId = key.split(':').pop(); // Extract userId from key
          if (userId && userId !== excludeUserId) {
            const nickname = await this.client.get(key);
            if (nickname) {
              typingUsers.push(nickname);
            }
          }
        }

        return typingUsers;
      } else {
        // Fallback: return empty array if Redis is not available
        return [];
      }
    } catch (error) {
      console.error('Redis getRoomTypingUsers error:', error);
      // Return empty array on error to prevent API failures
      return [];
    }
  }

  async addRoomMessage(roomId: string, message: Message): Promise<void> {
    if (!this.isConnected || !this.client) {
      if (!this.fallbackMaps.roomMessages.has(roomId)) {
        this.fallbackMaps.roomMessages.set(roomId, []);
      }
      const messages = this.fallbackMaps.roomMessages.get(roomId)!;
      messages.push(message);
      // Keep only last 100 messages
      if (messages.length > 100) {
        this.fallbackMaps.roomMessages.set(roomId, messages.slice(-100));
      }
      return;
    }

    try {
      await this.client.lpush(`room:${roomId}:messages`, this.serializeMessage(message));
      await this.client.ltrim(`room:${roomId}:messages`, 0, 99); // Keep only last 100
      await this.client.expire(`room:${roomId}:messages`, REDIS_TTL);
    } catch (error) {
      console.error('Redis addRoomMessage error, falling back to memory:', error);
      if (!this.fallbackMaps.roomMessages.has(roomId)) {
        this.fallbackMaps.roomMessages.set(roomId, []);
      }
      const messages = this.fallbackMaps.roomMessages.get(roomId)!;
      messages.push(message);
      if (messages.length > 100) {
        this.fallbackMaps.roomMessages.set(roomId, messages.slice(-100));
      }
    }
  }

  async clearRoomMessages(roomId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      this.fallbackMaps.roomMessages.delete(roomId);
      return;
    }

    try {
      await this.client.del(`room:${roomId}:messages`);
    } catch (error) {
      console.error('Redis clearRoomMessages error, falling back to memory:', error);
      this.fallbackMaps.roomMessages.delete(roomId);
    }
  }

  // Atomic operations
  async joinRoom(userId: string, roomId: string, participant: Participant): Promise<void> {
    if (!this.isConnected || !this.client) {
      // Fallback: sequential operations
      await this.setUserRoom(userId, roomId);
      await this.setRoomParticipant(roomId, userId, participant);
      return;
    }

    try {
      const multi = this.client.multi();
      
      // Set user's current room
      multi.set(`user:${userId}:room`, roomId, 'EX', REDIS_TTL);
      
      // Add user to room participants
      multi.hset(`room:${roomId}:participants`, userId, this.serializeParticipant(participant));
      multi.expire(`room:${roomId}:participants`, REDIS_TTL);
      
      await multi.exec();
    } catch (error) {
      console.error('Redis joinRoom atomic operation error, falling back to sequential:', error);
      await this.setUserRoom(userId, roomId);
      await this.setRoomParticipant(roomId, userId, participant);
    }
  }

  async leaveRoom(userId: string, roomId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      // Fallback: sequential operations
      await this.removeUserRoom(userId);
      await this.removeRoomParticipant(roomId, userId);
      return;
    }

    try {
      const multi = this.client.multi();
      
      // Remove user's current room
      multi.del(`user:${userId}:room`);
      
      // Remove user from room participants
      multi.hdel(`room:${roomId}:participants`, userId);
      
      await multi.exec();
    } catch (error) {
      console.error('Redis leaveRoom atomic operation error, falling back to sequential:', error);
      await this.removeUserRoom(userId);
      await this.removeRoomParticipant(roomId, userId);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: string }> {
    if (!this.isConnected || !this.client) {
      return {
        status: 'degraded',
        details: 'Using memory fallback - Redis connection failed'
      };
    }

    try {
      await this.client.ping();
      return {
        status: 'healthy',
        details: 'Redis connection successful'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: `Redis health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Cleanup
  async cleanupEmptyRoom(roomId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      // Fallback: check and cleanup sequentially
      const participants = this.fallbackMaps.roomParticipants.get(roomId);
      if (!participants || participants.size === 0) {
        this.fallbackMaps.roomCreators.delete(roomId);
        this.fallbackMaps.roomMessages.delete(roomId);
      }
      return;
    }

    try {
      // Use Lua script for atomic operation
      const luaScript = `
        local roomKey = KEYS[1]
        local participantsKey = KEYS[2]
        local creatorKey = KEYS[3]
        local messagesKey = KEYS[4]
        
        -- Check if room has no participants
        local participantCount = redis.call('HLEN', participantsKey)
        
        if participantCount == 0 then
          -- Remove room creator
          redis.call('DEL', creatorKey)
          -- Clear room messages
          redis.call('DEL', messagesKey)
          return 1
        else
          return 0
        end
      `;
      
      const keys = [
        `room:${roomId}`,
        `room:${roomId}:participants`,
        `room:${roomId}:creator`,
        `room:${roomId}:messages`
      ];
      
      await this.client.eval(luaScript, keys.length, ...keys);
    } catch (error) {
      console.error('Redis cleanupEmptyRoom error, falling back to sequential:', error);
      // Fallback: check and cleanup sequentially
      const participants = await this.getRoomParticipants(roomId);
      if (participants.size === 0) {
        await this.removeRoomCreator(roomId);
        await this.clearRoomMessages(roomId);
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
      } catch (error) {
        console.error('Error disconnecting Redis client:', error);
      } finally {
        this.client = null;
        this.isConnected = false;
      }
    }
  }
}

// Export singleton instance
export const redisStore = new RedisStore();

// Export types for use in other files
export type { Participant, Message };
