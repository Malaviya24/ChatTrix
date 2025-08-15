// Simple in-memory storage for rooms (in production, this would be a database)
// This is shared between room creation and joining APIs

interface Message {
  id: string;
  text: string;
  userId: string;
  nickname: string;
  avatar: string;
  timestamp: Date | string;
  isOwn: boolean;
  isInvisible?: boolean;
  isRevealed?: boolean;
}

interface RoomData {
  id: string;
  name: string;
  password: string;
  maxUsers: number;
  isPrivate: boolean;
  messageExpiration: number;
  
  panicMode: boolean;
  invisibleMode: boolean;
  creatorId?: string;
  creatorNickname?: string;
  creatorIP?: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  participants: Array<{
    userId: string;
    nickname: string;
    avatar: string;
    sessionId: string;
    ip: string;
    joinedAt: Date;
  }>;
  messages: Message[];
  security?: {
    
    panicMode: boolean;
    invisibleMode: boolean;
  };
}

// Use global variable to persist across API calls in Next.js
declare global {
  var __roomStorage: Map<string, RoomData> | undefined;
}

class RoomStorage {
  private rooms: Map<string, RoomData>;

  constructor() {
    // Use global storage if it exists, otherwise create new
    if (global.__roomStorage) {
      this.rooms = global.__roomStorage;
      console.log('🔄 Using existing global storage, rooms count:', this.rooms.size);
    } else {
      this.rooms = new Map<string, RoomData>();
      global.__roomStorage = this.rooms;
      console.log('🆕 Created new global storage');
    }
  }

  // Store a room
  setRoom(roomId: string, roomData: RoomData): void {
    this.rooms.set(roomId, roomData);
    console.log('💾 Room stored in global storage:', { roomId, password: roomData.password, totalRooms: this.rooms.size });
  }

  // Get a room by ID
  getRoom(roomId: string): RoomData | undefined {
    const room = this.rooms.get(roomId);
    console.log('📖 Room retrieved from storage:', { roomId, found: !!room, password: room?.password });
    return room;
  }

  // Check if room exists
  hasRoom(roomId: string): boolean {
    const has = this.rooms.has(roomId);
    console.log('🔍 Room exists check:', { roomId, exists: has });
    return has;
  }

  // Remove a room
  removeRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  // Get all rooms
  getAllRooms(): RoomData[] {
    const rooms = Array.from(this.rooms.values());
    console.log('📋 All rooms in storage:', rooms.map(r => ({ id: r.id, name: r.name, hasPassword: !!r.password })));
    return rooms;
  }

  // Clean up expired rooms (disabled for unlimited rooms)
  cleanupExpiredRooms(): void {
    // Rooms are unlimited, so we don't clean them up
    // This function is kept for future use if needed
    console.log('🔄 Room cleanup disabled - rooms are unlimited');
  }

  // Update room participants
  updateRoomParticipants(roomId: string, participants: RoomData['participants']): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      room.participants = participants;
      this.rooms.set(roomId, room);
      return true;
    }
    return false;
  }

  // Add participant to room
  addParticipant(roomId: string, participant: RoomData['participants'][0]): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      if (!room.participants) {
        room.participants = [];
      }
      room.participants.push(participant);
      this.rooms.set(roomId, room);
      return true;
    }
    return false;
  }

  // Remove participant from room
  removeParticipant(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (room && room.participants) {
      room.participants = room.participants.filter(p => p.userId !== userId);
      this.rooms.set(roomId, room);
      return true;
    }
    return false;
  }
}

// Export a singleton instance
export const roomStorage = new RoomStorage();

// Clean up expired rooms every 5 minutes
setInterval(() => {
  roomStorage.cleanupExpiredRooms();
}, 5 * 60 * 1000);
