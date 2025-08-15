'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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

interface User {
  userId: string;
  nickname: string;
  avatar: string;
  isTyping?: boolean;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  messages: Message[];
  participants: User[];
  typingUsers: string[];
  isRoomCreator: boolean;
  sendMessage: (message: string, options?: { isInvisible?: boolean }) => void;
  joinRoom: (roomId: string, userId: string, nickname: string, avatar: string) => void;
  leaveRoom: (roomId: string, userId: string, nickname: string) => void;
  setTyping: (isTyping: boolean) => void;
  kickUser: (userId: string) => void;
}

export function useSocket(roomId: string, userId: string, nickname: string, avatar: string, claimedCreatorStatus?: boolean): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);

  // Function to set up all socket event handlers
  const setupSocketEvents = useCallback((newSocket: Socket) => {
    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Connected to socket server');
      setIsConnected(true);
      
      // Join room immediately after connection
      newSocket.emit('join-room', { roomId, userId, nickname, avatar, isRoomCreator: claimedCreatorStatus });
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from socket server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      // Rejoin room after reconnection
      newSocket.emit('join-room', { roomId, userId, nickname, avatar, isRoomCreator: claimedCreatorStatus });
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('🔌 Socket reconnection error:', error);
      setIsConnected(false);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('🔌 Socket reconnection failed');
      setIsConnected(false);
    });

    // Room events
    newSocket.on('user-joined', (user: User) => {
      console.log('User joined:', user.nickname);
      
      // Add join notification message
      const joinMessage: Message = {
        id: `join-${Date.now()}`,
        text: `${user.nickname} joined the room`,
        userId: 'system',
        nickname: 'System',
        avatar: '🎉',
        timestamp: new Date(),
        isOwn: false
      };
      setMessages(prev => [...prev, joinMessage]);
    });

    newSocket.on('user-left', (user: User) => {
      console.log('User left:', user.nickname);
      
      // Add leave notification message
      const leaveMessage: Message = {
        id: `leave-${Date.now()}`,
        text: `${user.nickname} left the room`,
        userId: 'system',
        nickname: 'System',
        avatar: '👋',
        timestamp: new Date(),
        isOwn: false
      };
      setMessages(prev => [...prev, leaveMessage]);
    });

    // Message events
    newSocket.on('new-message', (message: Message) => {
      console.log('New message received:', message);
      
      // Check if this message is from another user
      if (message.userId !== userId) {
        // Add the message to the list
        setMessages(prev => [...prev, message]);
      }
    });



    // Typing events
    newSocket.on('user-typing', (data: { userId: string; nickname: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...new Set([...prev, data.nickname])]);
      } else {
        setTypingUsers(prev => prev.filter(name => name !== data.nickname));
      }
    });

    // Room creator events
    newSocket.on('room-creator-status', (data: { isCreator: boolean }) => {
      setIsRoomCreator(data.isCreator);
      console.log('Room creator status:', data.isCreator);
    });

    // Room participants update
    newSocket.on('room-participants', (participants: User[]) => {
      console.log('Room participants updated:', participants);
      setParticipants(participants);
    });

    // User kicked events
    newSocket.on('user-kicked', (data: { kickedUserId: string; kickedBy: string; reason?: string }) => {
      console.log('User kicked:', data);
      
      // Add kick notification message
      const kickMessage: Message = {
        id: `kick-${Date.now()}`,
        text: `A user was removed from the room`,
        userId: 'system',
        nickname: 'System',
        avatar: '🚫',
        timestamp: new Date(),
        isOwn: false
      };
      setMessages(prev => [...prev, kickMessage]);
    });

    // User was kicked (if it's the current user)
    newSocket.on('you-were-kicked', (data: { reason?: string }) => {
      console.log('You were kicked from the room:', data);
      alert(`You were removed from the room. ${data.reason || ''}`);
      // Redirect to landing page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    });
  }, [roomId, userId, nickname, avatar, claimedCreatorStatus]);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId || !userId || !nickname || !avatar) {
      console.log('Socket connection skipped - missing required parameters');
      return;
    }

    console.log('🔌 Initializing socket connection...');

              // Try to connect to the socket server with retry mechanism
     const connectWithRetry = async (attempt = 1, maxAttempts = 3) => {
       try {
         console.log(`🔄 Attempt ${attempt} to connect to socket server...`);
         
         const response = await fetch('/api/socket');
         if (!response.ok) {
           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
         }
         
         const serverStatus = await response.json();
         console.log('✅ Socket server status:', serverStatus);
         
         // Now connect to the socket
         const newSocket = io({
           transports: ['websocket', 'polling'],
           autoConnect: true,
           forceNew: true,
           timeout: 20000,
           reconnection: true,
           reconnectionAttempts: 5,
           reconnectionDelay: 1000
         });
         
         socketRef.current = newSocket;
         setSocket(newSocket);

         // Set up all the event handlers
         setupSocketEvents(newSocket);
         
         return newSocket;
       } catch (error) {
         console.error(`❌ Connection attempt ${attempt} failed:`, error);
         
         if (attempt < maxAttempts) {
           console.log(`🔄 Retrying in ${attempt * 1000}ms...`);
           await new Promise(resolve => setTimeout(resolve, attempt * 1000));
           return connectWithRetry(attempt + 1, maxAttempts);
         } else {
           throw error;
         }
       }
     };
     
          // Start connection process
     connectWithRetry()
       .then((newSocket) => {
         return () => {
           if (newSocket) {
             newSocket.disconnect();
           }
         };
       })
       .catch(error => {
         console.error('❌ Failed to initialize socket server:', error);
         console.log('🔄 Trying direct connection as fallback...');
         
         // Try direct connection as fallback
         const newSocket = io({
           transports: ['websocket', 'polling'],
           autoConnect: true,
           forceNew: true,
           timeout: 20000,
           reconnection: true,
           reconnectionAttempts: 5,
           reconnectionDelay: 1000
         });
         
         socketRef.current = newSocket;
         setSocket(newSocket);
         
         // Set up all the event handlers
         setupSocketEvents(newSocket);
         
         return () => {
           if (newSocket) {
             newSocket.disconnect();
           }
         };
       });
  }, [roomId, userId, nickname, avatar, claimedCreatorStatus, setupSocketEvents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Message expiry cleanup - automatically remove expired messages after 10 minutes
  useEffect(() => {
    if (messages.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      
      setMessages(prev => {
        const filtered = prev.filter(message => {
          const messageTime = typeof message.timestamp === 'string' 
            ? new Date(message.timestamp) 
            : message.timestamp;
          return messageTime > tenMinutesAgo;
        });
        
        // Log if any messages were expired
        if (filtered.length < prev.length) {
          console.log(`🕐 ${prev.length - filtered.length} messages expired and removed automatically`);
        }
        
        return filtered;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [messages]);

  // Send message
  const sendMessage = useCallback((message: string, options?: { isInvisible?: boolean }) => {
    if (socket && message.trim()) {
      const messageData = {
        roomId,
        message: message.trim(),
        userId,
        nickname,
        avatar,
        isInvisible: options?.isInvisible
      };
      
      socket.emit('send-message', messageData);
      
      // Add own message immediately
      const ownMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        userId,
        nickname,
        avatar,
        timestamp: new Date(),
        isOwn: true,
        isInvisible: options?.isInvisible || false
      };
      setMessages(prev => [...prev, ownMessage]);
    }
  }, [socket, roomId, userId, nickname, avatar]);

  // Join room
  const joinRoom = useCallback((roomId: string, userId: string, nickname: string, avatar: string, isRoomCreator?: boolean) => {
    if (socket) {
      socket.emit('join-room', { roomId, userId, nickname, avatar, isRoomCreator });
    }
  }, [socket]);

  // Leave room
  const leaveRoom = useCallback((roomId: string, userId: string, nickname: string) => {
    if (socket) {
      socket.emit('leave-room', { roomId, userId, nickname });
    }
  }, [socket]);

  // Set typing status
  const setTyping = useCallback((isTyping: boolean) => {
    if (socket) {
      socket.emit('typing', { roomId, userId, nickname, isTyping });
    }
  }, [socket, roomId, userId, nickname]);



  // Kick user (room creator only)
  const kickUser = useCallback((targetUserId: string) => {
    if (socket && isRoomCreator) {
      socket.emit('kick-user', { roomId, targetUserId, kickedBy: userId });
      console.log('Kicking user:', targetUserId);
    }
  }, [socket, roomId, userId, isRoomCreator]);

  return {
    socket,
    isConnected,
    messages,
    participants,
    typingUsers,
    isRoomCreator,
    sendMessage,
    joinRoom,
    leaveRoom,
    setTyping,
    kickUser
  };
}
