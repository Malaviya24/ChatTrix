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
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  connectionError: string | null;
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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagePollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string>('');

  // Function to make API calls to our API endpoint
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

  // Function to fetch messages from the server
  const fetchMessages = useCallback(async () => {
    try {
      const result = await makeApiCall('get-messages', { roomId });
      if (result.success && result.messages) {
        // Convert server messages to client format
        const clientMessages: Message[] = result.messages.map((msg: Record<string, unknown>) => ({
          ...msg,
          isOwn: msg.userId === userId,
          timestamp: new Date(msg.timestamp as string)
        }));
        
        // Only update if we have new messages (compare content, not just length)
        setMessages(prevMessages => {
          // Check if messages are actually different
          if (prevMessages.length !== clientMessages.length) {
            console.log('📨 Fetched messages:', clientMessages.length);
            return clientMessages;
          }
          
          // Check if any message content has changed
          const hasChanges = clientMessages.some((newMsg, index) => {
            const prevMsg = prevMessages[index];
            return !prevMsg || 
                   prevMsg.text !== newMsg.text || 
                   prevMsg.userId !== newMsg.userId ||
                   prevMsg.timestamp.toString() !== newMsg.timestamp.toString();
          });
          
          if (hasChanges) {
            console.log('📨 Messages updated:', clientMessages.length);
            return clientMessages;
          }
          
          return prevMessages; // No changes, keep existing messages
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch messages:', error);
    }
  }, [roomId, userId]);

  // Join room function
  const joinRoom = useCallback(async (roomId: string, userId: string, nickname: string, avatar: string, isRoomCreator?: boolean) => {
    try {
      // Debug logging
      console.log('🔌 Socket - Joining room with data:', { roomId, userId, nickname, avatar, isRoomCreator });
      
      const result = await makeApiCall('join-room', { roomId, userId, nickname, avatar, isRoomCreator });
      
      if (result.success) {
        setParticipants(result.participants || []);
        setIsRoomCreator(result.isCreator || false);
        setIsConnected(true);
        setConnectionStatus('connected');
        setConnectionError(null);
        
        // Fetch existing messages when joining (only once)
        await fetchMessages();
        
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
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Failed to join room');
    }
  }, [fetchMessages]);

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
      const result = await makeApiCall('typing', { roomId, userId, nickname, isTyping });
      
      if (result.success) {
        // Update typingUsers with other users' typing status (excluding current user)
        if (result.typingUsers) {
          setTypingUsers(result.typingUsers);
        }
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

  // Fetch typing status
  const fetchTypingStatus = useCallback(async () => {
    try {
      const result = await makeApiCall('get-typing-status', { roomId });
      if (result.success && result.typingStatus) {
        setTypingUsers(result.typingStatus);
      } else {
        // Handle case where API returns success but no typing status
        setTypingUsers([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch typing status:', error);
      // Set empty typing users on error to prevent UI issues
      setTypingUsers([]);
      
      // Log specific error details for debugging
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          console.warn('⚠️ Typing status endpoint not found - this might be a deployment issue');
        } else if (error.message.includes('500')) {
          console.warn('⚠️ Server error while fetching typing status - Redis might be unavailable');
        }
      }
    }
  }, [roomId]);

  // Polling mechanism for participants and room updates
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

        // Poll for typing status updates
        await fetchTypingStatus();
      } catch (error) {
        console.error('❌ Polling failed:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        setConnectionError(error instanceof Error ? error.message : 'Connection polling failed');
      }
    };

    // Poll every 3 seconds for participants
    pollingIntervalRef.current = setInterval(pollForUpdates, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isConnected, roomId, userId, nickname, avatar, claimedCreatorStatus, participants, isRoomCreator, fetchTypingStatus]);

  // Polling mechanism for new messages
  useEffect(() => {
    if (!isConnected || !roomId) return;

    const pollForMessages = async () => {
      await fetchMessages();
    };

    // Poll every 2 seconds for new messages
    messagePollingIntervalRef.current = setInterval(pollForMessages, 2000);

    return () => {
      if (messagePollingIntervalRef.current) {
        clearInterval(messagePollingIntervalRef.current);
      }
    };
  }, [isConnected, roomId, fetchMessages]);

  // Initialize connection when component mounts
  useEffect(() => {
    if (!roomId || !userId || !nickname || !avatar) {
      console.log('Socket connection skipped - missing required parameters');
      return;
    }

    console.log('🔌 Initializing HTTP-based connection...');
    
    // Join room immediately
    joinRoom(roomId, userId, nickname, avatar, claimedCreatorStatus || false);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (messagePollingIntervalRef.current) {
        clearInterval(messagePollingIntervalRef.current);
      }
      // Leave room on unmount
      leaveRoom(roomId, userId, nickname);
    };
  }, [roomId, userId, nickname, avatar, claimedCreatorStatus, joinRoom, leaveRoom]);

  // Message expiry cleanup - automatically remove expired messages after 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      
      setMessages(prev => {
        if (prev.length === 0) return prev;
        
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
  }, []); // No dependencies - run once on mount

  return {
    isConnected,
    connectionStatus,
    connectionError,
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
