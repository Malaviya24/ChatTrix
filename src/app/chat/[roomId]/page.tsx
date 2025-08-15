'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';

import { useSocket } from '@/hooks/useSocket';
import { useSmoothScroll } from '@/hooks/useLenis';

import QRCodeGenerator from '@/components/QRCodeGenerator';
import AppIcon from '@/components/ui/AppIcon';

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



export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  
  // Get user data from localStorage (set when joining room)
  const [userData, setUserData] = useState<{
    userId: string;
    nickname: string;
    avatar: string;
    isRoomCreator?: boolean;
  } | null>(null);



  // Initialize smooth scrolling for chat
  const { scrollToBottom } = useSmoothScroll();

  // State for UI
  const [newMessage, setNewMessage] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [isInvisibleMode, setIsInvisibleMode] = useState(false);
  const [showJoinAnimation, setShowJoinAnimation] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [roomExpiry, setRoomExpiry] = useState<Date | null>(null);
  const [invisibleMessages, setInvisibleMessages] = useState<Set<string>>(new Set());


  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize socket connection only when user data is available
  const socketData = userData ? {
    roomId,
    userId: userData.userId,
    nickname: userData.nickname,
    avatar: userData.avatar
  } : null;

  const {
    isConnected,
    messages,
    participants,
    typingUsers,
    isRoomCreator,
    sendMessage,
    setTyping,
    kickUser
  } = useSocket(
    socketData?.roomId || '',
    socketData?.userId || '',
    socketData?.nickname || '',
    socketData?.avatar || '',
    userData?.isRoomCreator
  );

  // Load user data on mount
  useEffect(() => {
    const savedUserData = localStorage.getItem(`chatRoom_${roomId}`);
    if (savedUserData) {
      const parsed = JSON.parse(savedUserData);
      setUserData(parsed);
    } else {
      // Redirect to join room if no user data
      router.push(`/join-room?roomId=${roomId}`);
    }
  }, [roomId, router]);



  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Use Lenis smooth scrolling instead of native scrollIntoView
      setTimeout(() => {
        scrollToBottom({ duration: 0.8 });
      }, 100);
    }
  }, [messages, scrollToBottom]);

  // Show join animation when user data is loaded
  useEffect(() => {
    if (userData) {
      setShowJoinAnimation(true);
      setTimeout(() => setShowJoinAnimation(false), 3000);
    }
  }, [userData]);



  // Calculate room expiry time (unlimited - 24 hours from creation for display purposes only)
  const getRoomExpiryTime = () => {
    if (!roomExpiry) return null;
    
    const now = new Date();
    const diff = roomExpiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Unlimited';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Set room expiry time (24 hours from now for display purposes only - rooms are actually unlimited)
  useEffect(() => {
    if (userData) {
      setRoomExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000));
    }
  }, [userData]);

  // Update countdown every minute (not every second to reduce performance impact)
  useEffect(() => {
    if (!roomExpiry) return;

    const interval = setInterval(() => {
      // Rooms are unlimited, so we don't redirect users
      // This is just for display purposes
    }, 60000); // Check every minute instead of every second

    return () => clearInterval(interval);
  }, [roomExpiry]);

  // Handle typing with a more stable approach
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set typing to true
    setTyping(true);
    
    // Set typing to false after 1 second of no input
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1000);
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);



  // Handle send message
  const handleSendMessage = () => {
    if (newMessage.trim() && userData) {
      // Send message with invisible mode if enabled
      sendMessage(newMessage, { isInvisible: isInvisibleMode });
      setNewMessage('');
      setTyping(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time
  const formatTime = (date: Date | string) => {
    // Handle both Date objects and date strings
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid time';
    }
    
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get time until expiry (fixed 10 minutes)
  const getTimeUntilExpiry = (timestamp: Date | string) => {
    const now = new Date();
    const timestampDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    // Check if the date is valid
    if (isNaN(timestampDate.getTime())) {
      return 'Invalid time';
    }
    
    const expiry = new Date(timestampDate.getTime() + 10 * 60 * 1000); // Fixed 10 minutes
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };



  // Handle invisible message revelation
  const handleMessageReveal = (messageId: string) => {
    setInvisibleMessages(prev => {
      const newSet = new Set(prev);
      newSet.add(messageId);
      return newSet;
    });
  };

  // Check if message should be visible
  const isMessageVisible = (message: Message) => {
    if (!message.isInvisible) return true;
    if (message.isOwn) return true;
    return invisibleMessages.has(message.id);
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading chat room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black relative overflow-hidden">
      {/* Security Status Bar */}
      <div className="fixed top-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-b border-blue-500/20 z-50">
        <div className="flex flex-col sm:flex-row justify-between items-center text-white text-xs sm:text-sm gap-2 sm:gap-4 p-2 sm:p-3">
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-wrap justify-center sm:justify-start">
            {/* Room ID - Responsive */}
            <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs flex items-center gap-1">
              <AppIcon name="lock" size="sm" className="text-blue-400 flex-shrink-0" />
              <span className="hidden sm:inline">ROOM:</span>
              <span className="font-mono">{roomId}</span>
            </span>
            
            {/* Creator Badge */}
            {isRoomCreator && (
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 text-yellow-400 text-xs flex items-center gap-1">
                <AppIcon name="crown" size="sm" className="text-yellow-400 flex-shrink-0" />
                <span className="hidden sm:inline">CREATOR</span>
              </span>
            )}
            
                         {/* Room Expiry - Responsive */}
             <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs bg-green-600/20 border border-green-500/30 text-green-400">
               <span className="flex items-center gap-1">
                 <AppIcon name="timer-reset" size="sm" className="text-green-400" />
                 <span className="hidden sm:inline">{getRoomExpiryTime() || 'Unlimited'}</span>
               </span>
             </span>
            
            {/* Invisible Mode - Responsive */}
            <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs ${
              isInvisibleMode 
                ? 'bg-purple-600/20 border border-purple-500/30 text-purple-400' 
                : 'bg-gray-600/20 border border-gray-500/30 text-gray-400'
            }`}>
              {isInvisibleMode ? (
                <span className="flex items-center gap-1">
                  <AppIcon name="ghost" size="sm" className="text-purple-400 flex-shrink-0" />
                  <span className="hidden sm:inline">INVISIBLE</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AppIcon name="eye" size="sm" className="text-gray-400 flex-shrink-0" />
                  <span className="hidden sm:inline">VISIBLE</span>
                </span>
              )}
            </span>
            
            {/* Connection Status - Responsive */}
            <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs ${
              isConnected ? 'bg-green-600/20 border border-green-500/30 text-green-400' : 'bg-red-600/20 border border-red-500/30 text-red-400'
            }`}>
              {isConnected ? (
                <span className="flex items-center gap-1">
                  <AppIcon name="zap" size="sm" className="text-green-400 flex-shrink-0" />
                  <span className="hidden sm:inline">CONNECTED</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AppIcon name="alert-triangle" size="sm" className="text-red-400 flex-shrink-0" />
                  <span className="hidden sm:inline">DISCONNECTED</span>
                </span>
              )}
            </span>
          </div>
          

        </div>
      </div>

      {/* Join Animation */}
      <AnimatePresence>
        {showJoinAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-2xl border border-blue-400/30"
          >
            <div className="flex items-center gap-3">
              <AppIcon name="heart" size="lg" className="text-white" />
              <span className="font-bold">Welcome to the room, {userData.nickname}!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="pt-20 pb-24 px-3 sm:px-4 lg:px-6 h-screen flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm sm:text-base"
            >
              ← Back
            </button>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Room: {roomId}</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setShowQRCode(true)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-lg text-xs font-semibold transition-all"
            >
              <span className="flex items-center gap-1">
                <AppIcon name="link" size="sm" className="text-green-400" />
                <span className="hidden sm:inline">Share Room</span>
              </span>
            </button>
            
            <button
              onClick={() => setIsInvisibleMode(!isInvisibleMode)}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all ${
                isInvisibleMode 
                  ? 'bg-purple-600/20 border border-purple-500/30 text-purple-400' 
                  : 'bg-gray-600/20 border border-gray-500/30 text-gray-400'
              }`}
            >
              {isInvisibleMode ? (
                <span className="flex items-center gap-1">
                  <AppIcon name="ghost" size="sm" className="text-purple-400" />
                  <span className="hidden sm:inline">Invisible</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AppIcon name="eye" size="sm" className="text-gray-400" />
                  <span className="hidden sm:inline">Visible</span>
                </span>
              )}
            </button>
            
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="sm:hidden px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs"
            >
              <span className="flex items-center gap-1">
                <AppIcon name="users" size="sm" className="text-blue-400" />
                {participants.length}
              </span>
            </button>
          </div>
        </div>



        {/* Messages Area */}
        <div className="flex-1 flex gap-3 sm:gap-4">
          {/* Chat Messages */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 mb-3 sm:mb-4 pr-1 sm:pr-2">
              <AnimatePresence>
                {messages.map((message) => {
                  const isVisible = isMessageVisible(message);
                  const isInvisible = message.isInvisible && !message.isOwn;
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs sm:max-w-md lg:max-w-lg ${
                        message.userId === 'system' 
                          ? 'bg-yellow-600/20 border border-yellow-500/30 text-yellow-300' 
                          : message.isOwn 
                            ? 'bg-blue-600/20 border border-blue-500/30 text-white' 
                            : isInvisible && !isVisible
                              ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300 cursor-pointer hover:bg-purple-600/30 transition-all'
                              : 'bg-white/10 border border-white/20 text-white'
                      } rounded-2xl px-4 py-3 backdrop-blur-sm`}>
                        
                        {/* System messages */}
                        {message.userId === 'system' ? (
                          <div className="text-center">
                            <div className="text-lg mb-1">{message.avatar}</div>
                            <p className="text-sm">{message.text}</p>
                          </div>
                        ) : (
                          <>
                            {/* User message header */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{message.avatar}</span>
                              <span className="font-semibold text-sm">{message.nickname}</span>
                              <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                              {isInvisible && (
                                <span className="text-xs text-purple-400">
                                  <AppIcon name="ghost" size="sm" className="text-purple-400" />
                                </span>
                              )}
                            </div>
                            
                            {/* Message text */}
                            {isInvisible && !isVisible ? (
                              <div 
                                className="text-center py-4 cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => handleMessageReveal(message.id)}
                                title="Click to reveal hidden message"
                              >
                                <div className="mb-2">
                                  <AppIcon name="ghost" size="lg" className="text-purple-300" />
                                </div>
                                <p className="text-sm text-purple-300">
                                  Hidden Message
                                </p>
                                <p className="text-xs text-purple-400 mt-1">
                                  Click to reveal
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed mb-2">{message.text}</p>
                            )}
                            
                            {/* Message footer */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">
                                Expires in: {getTimeUntilExpiry(message.timestamp)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {/* Typing indicators */}
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                      </span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-white/20 border border-white/30 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Send
                </button>
              </div>
              
                             {/* Message Settings */}
               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-xs text-gray-400">
                     <label className="flex items-center gap-1">
                       <input
                         type="checkbox"
                         checked={isInvisibleMode}
                         onChange={(e) => setIsInvisibleMode(e.target.checked)}
                         className="rounded"
                       />
                       <span className={`flex items-center gap-1 ${isInvisibleMode ? 'text-purple-400' : ''}`}>
                         {isInvisibleMode ? (
                           <AppIcon name="ghost" size="sm" className="text-purple-400" />
                         ) : (
                           <AppIcon name="eye" size="sm" className="text-gray-400" />
                         )} Invisible Mode
                       </span>
                     </label>
                     
                     <span className="text-gray-400 flex items-center gap-1">
                       <AppIcon name="timer-reset" size="sm" className="text-gray-400" />
                       Messages expire in 10 minutes
                     </span>
                   </div>
            </div>
          </div>

          {/* Participants Sidebar */}
          <div className={`hidden lg:block w-56 xl:w-64 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-3 sm:p-4 ${
            showParticipants ? 'lg:block' : 'lg:hidden'
          }`}>
            {/* Admin Panel for Room Creator */}
            {isRoomCreator && (
              <div className="mb-4 p-3 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AppIcon name="shield-check" size="sm" className="text-yellow-400" />
                  <span className="text-yellow-400 font-semibold text-sm">Room Admin</span>
                </div>
                <p className="text-yellow-300 text-xs mb-3">
                  You have full control over this room. You can see all participants and remove users if needed.
                </p>
                <div className="flex items-center gap-2 text-xs text-yellow-300">
                  <AppIcon name="users" size="sm" className="text-yellow-400" />
                  <span>{participants.length} participants</span>
                </div>
              </div>
            )}
            
            <h3 className="text-lg font-semibold text-white mb-4">
              Participants ({participants.length})
              {isRoomCreator && (
                <span className="ml-2 text-xs text-yellow-400 flex items-center gap-1">
                  <AppIcon name="users" size="sm" className="text-yellow-400" />
                  Admin
                </span>
              )}
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {participants.map((participant) => (
                  <motion.div
                    key={participant.userId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/20"
                  >
                    <span className="text-2xl">{participant.avatar}</span>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{participant.nickname}</p>
                      <p className="text-gray-400 text-xs">Online</p>
                      {participant.userId === userData?.userId && (
                        <p className="text-blue-400 text-xs">You</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {typingUsers.includes(participant.nickname) && (
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      )}
                      {isRoomCreator && participant.userId !== userData?.userId && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${participant.nickname} from the room?`)) {
                              kickUser(participant.userId);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors p-1 group relative"
                          title={`Remove ${participant.nickname} from room`}
                        >
                          <AppIcon name="trash-2" size="sm" className="text-red-400" />
                          {/* Enhanced tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                            Kick {participant.nickname}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                          </div>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Participants Modal */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setShowParticipants(false)}
          >
            <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-sm rounded-t-3xl border border-white/20 p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
              {/* Admin Panel for Room Creator */}
              {isRoomCreator && (
                <div className="mb-4 p-3 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AppIcon name="shield-check" size="sm" className="text-yellow-400" />
                    <span className="text-yellow-400 font-semibold text-sm">Room Admin</span>
                  </div>
                  <p className="text-yellow-300 text-xs mb-3">
                    You have full control over this room. You can see all participants and remove users if needed.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-yellow-300">
                    <AppIcon name="users" size="sm" className="text-yellow-400" />
                    <span>{participants.length} participants</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Participants ({participants.length})
                  {isRoomCreator && (
                    <span className="ml-2 text-xs text-yellow-400 flex items-center gap-1">
                   <AppIcon name="users" size="sm" className="text-yellow-400" />
                   Admin
                 </span>
                  )}
                </h3>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="text-white hover:text-gray-300"
                >
                  <AppIcon name="x" size="sm" className="text-white" />
                </button>
              </div>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.userId}
                    className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/20"
                  >
                    <span className="text-2xl">{participant.avatar}</span>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{participant.nickname}</p>
                      <p className="text-gray-400 text-xs">Online</p>
                      {participant.userId === userData?.userId && (
                        <p className="text-blue-400 text-xs">You</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {typingUsers.includes(participant.nickname) && (
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      )}
                      {isRoomCreator && participant.userId !== userData?.userId && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${participant.nickname} from the room?`)) {
                              kickUser(participant.userId);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors p-1 group relative"
                          title={`Remove ${participant.nickname} from room`}
                        >
                          <AppIcon name="trash-2" size="sm" className="text-red-400" />
                          {/* Enhanced tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                            Kick {participant.nickname}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Admin Button for Room Creator */}
      {isRoomCreator && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-3 sm:bottom-4 left-3 sm:left-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-2.5 sm:p-3 rounded-xl shadow-lg z-40 cursor-pointer hover:from-yellow-700 hover:to-orange-700 transition-all duration-300"
          onClick={() => setShowParticipants(true)}
          title="Room Admin Panel"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <AppIcon name="shield-check" size="sm" className="text-white" />
            <span className="text-xs sm:text-sm font-semibold">Admin</span>
          </div>
        </motion.div>
      )}





      {/* QR Code Modal */}
      {showQRCode && (
        <QRCodeGenerator
          roomId={roomId}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
}
