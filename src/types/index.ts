export interface User {
  _id: string;
  nickname: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
}

export interface Room {
  _id: string;
  name: string;
  password?: string;
  maxUsers: number;
  currentUsers: User[];
  isPrivate: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface Message {
  _id: string;
  roomId: string;
  userId: string;
  nickname: string;
  content: string;
  encryptedContent: string;
  messageType: 'text' | 'emoji' | 'file';
  createdAt: Date;
  expiresAt: Date;
}

export interface ChatMessage {
  id: string;
  content: string;
  nickname: string;
  avatar: string;
  timestamp: Date | string;
  isOwn: boolean;
}

export interface CreateRoomData {
  name: string;
  password?: string;
  maxUsers: number;
}

export interface JoinRoomData {
  roomId: string;
  nickname: string;
  password?: string;
}

export interface SocketUser {
  id: string;
  nickname: string;
  avatar: string;
  roomId: string;
}

export interface RoomState {
  id: string;
  name: string;
  users: SocketUser[];
  messages: ChatMessage[];
  maxUsers: number;
  isPrivate: boolean;
}
