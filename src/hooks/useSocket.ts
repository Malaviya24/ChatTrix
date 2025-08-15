'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string>('');

  // Function to make API calls to our Edge Runtime endpoint
  const makeApiCall = async (action: string, data: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/socket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ API call failed for ${action}:`, error);
      throw error;
    }
  };

  // Join room function
  const joinRoom = useCallback(async (roomId: string, userId: string, nickname: string, avatar: string, isRoomCreator?: boolean) => {
    try {
      const result = await makeApiCall('join-room', { roomId, userId, nickname, avatar, isRoomCreator });
      
      if (result.success) {
        setParticipants(result.participants || []);
        setIsRoomCreator(result.isCreator || false);
        setIsConnected(true);
        
        // Add join notification message
        const joinMessage: Message = {
          id: `join-${Date.now()}`,
          text: `${nickname} joined the room`,
          userId: 'system',
          nickname: 'System',
          avatar: '🎉',
          timestamp: new Date(),
          isOwn: false
        };
        setMessages(prev => [...prev, joinMessage]);
        
        console.log('✅ Successfully joined room:', result);
      }
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      setIsConnected(false);
    }
  }, []);

  // Send message function
  const sendMessage = useCallback(async (message: string, options?: { isInvisible?: boolean }) => {
    if (!message.trim()) return;

    try {
      const result = await makeApiCall('send-message', { 
        roomId, 
        message: message.trim(), 
        userId, 
        nickname, 
        avatar, 
        isInvisible: options?.isInvisible 
      });
      
      if (result.success) {
        // Add own message immediately
        const ownMessage: Message = {
          id: result.messageId || Date.now().toString(),
          text: message.trim(),
          userId,
          nickname,
          avatar,
          timestamp: new Date(),
          isOwn: true,
          isInvisible: options?.isInvisible || false
        };
        setMessages(prev => [...prev, ownMessage]);
        lastMessageIdRef.current = ownMessage.id;
        
        console.log('✅ Message sent successfully');
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  }, [roomId, userId, nickname, avatar]);

  // Set typing status
  const setTyping = useCallback(async (isTyping: boolean) => {
    try {
      await makeApiCall('typing', { roomId, userId, nickname, isTyping });
      
      if (isTyping) {
        setTypingUsers(prev => [...new Set([...prev, nickname])]);
      } else {
        setTypingUsers(prev => prev.filter(name => name !== nickname));
      }
    } catch (error) {
      console.error('❌ Failed to set typing status:', error);
    }
  }, [roomId, userId, nickname]);

  // Leave room function
  const leaveRoom = useCallback(async (roomId: string, userId: string, nickname: string) => {
    try {
      const result = await makeApiCall('leave-room', { roomId, userId, nickname });
      
      if (result.success) {
        // Add leave notification message
        const leaveMessage: Message = {
          id: `leave-${Date.now()}`,
          text: `${nickname} left the room`,
          userId: 'system',
          nickname: 'System',
          avatar: '👋',
          timestamp: new Date(),
          isOwn: false
        };
        setMessages(prev => [...prev, leaveMessage]);
        
        setIsConnected(false);
        console.log('✅ Successfully left room');
      }
    } catch (error) {
      console.error('❌ Failed to leave room:', error);
    }
  }, []);

  // Kick user function
  const kickUser = useCallback(async (targetUserId: string) => {
    if (!isRoomCreator) return;

    try {
      const result = await makeApiCall('kick-user', { roomId, targetUserId, kickedBy: userId });
      
      if (result.success) {
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
        
        // Remove kicked user from participants
        setParticipants(prev => prev.filter(p => p.userId !== targetUserId));
        
        console.log('✅ User kicked successfully');
      }
    } catch (error) {
      console.error('❌ Failed to kick user:', error);
    }
  }, [roomId, userId, isRoomCreator]);

  // Polling mechanism to simulate real-time updates
  useEffect(() => {
    if (!isConnected || !roomId) return;

    const pollForUpdates = async () => {
      try {
        // Poll for new participants
        const result = await makeApiCall('join-room', { roomId, userId, nickname, avatar, isRoomCreator: claimedCreatorStatus });
        
        if (result.success) {
          // Update participants if changed
          if (JSON.stringify(result.participants) !== JSON.stringify(participants)) {
            setParticipants(result.participants || []);
          }
          
          // Update room creator status if changed
          if (result.isCreator !== isRoomCreator) {
            setIsRoomCreator(result.isCreator || false);
          }
        }
      } catch (error) {
        console.error('❌ Polling failed:', error);
        setIsConnected(false);
      }
    };

    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(pollForUpdates, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isConnected, roomId, userId, nickname, avatar, claimedCreatorStatus, participants, isRoomCreator]);

  // Initialize connection when component mounts
  useEffect(() => {
    if (!roomId || !userId || !nickname || !avatar) {
      console.log('Socket connection skipped - missing required parameters');
      return;
    }

    console.log('🔌 Initializing HTTP-based connection...');
    
    // Join room immediately
    joinRoom(roomId, userId, nickname, avatar, claimedCreatorStatus);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      // Leave room on unmount
      leaveRoom(roomId, userId, nickname);
    };
  }, [roomId, userId, nickname, avatar, claimedCreatorStatus, joinRoom, leaveRoom]);

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

  return {
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
