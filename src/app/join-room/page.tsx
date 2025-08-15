'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import AppIcon from '@/components/ui/AppIcon';

function JoinRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    roomId: searchParams?.get('roomId') || '',
    nickname: '',
    password: '',
    avatar: '🦊',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [roomValidation, setRoomValidation] = useState<{
    isValid: boolean;
    isChecking: boolean;
    error?: string;
    suggestions?: string[];
    roomInfo?: {
      id: string;
      name: string;
      isPrivate: boolean;
      createdAt: string;
      expiresAt: string;
      timeLeft?: string;
      currentUsers?: number;
      maxUsers?: number;
      requiresPassword?: boolean;
    };
  } | null>(null);

  // Avatar options
  const avatarOptions = ['🦊', '🐱', '🐶', '🐼', '🐨', '🦁', '🐯', '🐸', '🐙', '🦄', '🦋', '🐢', '🦕', '🦖', '🐉', '🦅'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarSelect = (avatar: string) => {
    setFormData(prev => ({
      ...prev,
      avatar
    }));
  };

  // Auto-generate nickname if not provided
  const generateNickname = () => {
    const adjectives = ['Swift', 'Brave', 'Wise', 'Calm', 'Bright', 'Gentle', 'Clever', 'Bold'];
    const nouns = ['Fox', 'Lion', 'Eagle', 'Wolf', 'Bear', 'Dragon', 'Phoenix', 'Tiger'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 999);
    return `${randomAdjective}${randomNoun}${randomNumber}`;
  };

  // Validate room ID in real-time
  const validateRoomId = async (roomId: string) => {
    if (!roomId || roomId.length !== 8) {
      setRoomValidation(null);
      return;
    }

    setRoomValidation({ isValid: false, isChecking: true });

    try {
      const response = await fetch('/api/rooms/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId }),
      });

      const data = await response.json();

      if (data.exists && data.isActive) {
        setRoomValidation({
          isValid: true,
          isChecking: false,
          roomInfo: data.room
        });
      } else {
        setRoomValidation({
          isValid: false,
          isChecking: false,
          error: data.message || data.error,
          suggestions: data.suggestions
        });
      }
    } catch {
      setRoomValidation({
        isValid: false,
        isChecking: false,
        error: 'Failed to validate room. Please try again.'
      });
    }
  };

  // Debounced room ID validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.roomId && formData.roomId.length === 8) {
        validateRoomId(formData.roomId);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.roomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    // Validation
    const newErrors: string[] = [];
    if (!formData.roomId.trim()) newErrors.push('Room ID is required');
    if (!formData.nickname.trim()) {
      // Auto-generate nickname if not provided
      formData.nickname = generateNickname();
    }
    if (formData.nickname.length < 2) newErrors.push('Nickname must be at least 2 characters');
    if (formData.nickname.length > 20) newErrors.push('Nickname must be less than 20 characters');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Call the API to join room
      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 410 && data.error?.includes('expired')) {
          setErrors(['This room is no longer available. Please check the room ID and try again.']);
        } else if (response.status === 409 && data.error?.includes('capacity')) {
          setErrors(['Room is at maximum capacity.']);
        } else if (response.status === 401 && data.error?.includes('password')) {
          setErrors(['Incorrect password. Please try again.']);
        } else {
          throw new Error(data.error || 'Failed to join room');
        }
        setIsLoading(false);
        return;
      }

      if (data.success) {
        // Show success message (non-blocking)
        // Note: In a real app, you would use a toast notification system here
        console.log(`Successfully joined room: ${data.room.name}`);
        
        // Save user data to localStorage for chat room access
        const userData = {
          userId: data.userId,
          nickname: formData.nickname,
          avatar: formData.avatar,
          isRoomCreator: false // Users joining existing rooms are not creators
        };
        localStorage.setItem(`chatRoom_${formData.roomId}`, JSON.stringify(userData));
        
        // Redirect to chat room
        router.push(`/chat/${formData.roomId}`);
      } else {
        throw new Error('Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to join room. Please check the room ID and password.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Simple Back Button */}
      <div className="fixed top-6 left-6 z-50">
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium hover:bg-white transition-all duration-300 shadow-lg border border-gray-200"
          >
            ← Back to Home
          </motion.button>
        </Link>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="max-w-4xl mx-auto pt-20 sm:pt-24 lg:pt-28 px-3 sm:px-4 lg:px-6 pb-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center text-gray-900 mb-8 sm:mb-12 lg:mb-16"
        >
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            Join Your Secure Community
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
            Enter the room ID and your credentials to join an existing secure chat room
          </p>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/50 p-4 sm:p-6 lg:p-8 xl:p-10 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Room Information */}
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center mb-6 sm:mb-8">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚪</div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Room Details</h3>
                <p className="text-sm sm:text-base text-gray-600">Connect to an existing secure chat room</p>
              </div>
              
              {/* Room ID */}
              <div>
                <label htmlFor="roomId" className="block text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">
                  Room ID *
                </label>
                <input
                  type="text"
                  id="roomId"
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base sm:text-lg font-mono text-center"
                  placeholder="Enter room ID"
                  required
                />
                <p className="text-sm text-gray-500 mt-2 text-center">Ask the room creator for the Room ID</p>
                
                {/* Room Validation Feedback */}
                {roomValidation && (
                  <div className="mt-3">
                    {roomValidation.isChecking ? (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Validating room...</span>
                      </div>
                    ) : roomValidation.isValid ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-green-700">
                          <span className="text-xl">✅</span>
                          <div>
                            <p className="font-semibold text-sm">Room Valid!</p>
                            {roomValidation.roomInfo && (
                              <div className="text-xs text-green-600 mt-1">
                                <p>• {roomValidation.roomInfo.name}</p>
                                <p>• Time left: {roomValidation.roomInfo.expiresAt ? 
                                  (() => {
                                    const now = Date.now();
                                    const expiresAt = new Date(roomValidation.roomInfo.expiresAt).getTime();
                                    const timeLeft = expiresAt - now;
                                    if (timeLeft <= 0) return 'Expired';
                                    const minutes = Math.floor(timeLeft / (1000 * 60));
                                    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                                    return `${minutes}m ${seconds}s`;
                                  })() : 'N/A'
                                }</p>
                                <p>• Users: {roomValidation.roomInfo.currentUsers}/{roomValidation.roomInfo.maxUsers}</p>
                                {roomValidation.roomInfo.requiresPassword && (
                                  <p>• Password required</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <div className="flex items-start gap-2 text-red-700">
                          <span className="text-xl mt-0.5">❌</span>
                          <div>
                            <p className="font-semibold text-sm">{roomValidation.error}</p>
                            {roomValidation.suggestions && (
                              <ul className="text-xs text-red-600 mt-2 space-y-1">
                                {roomValidation.suggestions.map((suggestion, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <span>•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-lg font-semibold text-gray-800 mb-3">
                  Room Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-4 bg-gray-50 border rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg pr-10 ${
                      showPassword ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
                    }`}
                    placeholder="Enter room password (if required)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-gray-700 transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.45 18.45 0 0 1-2.17 3.19M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.45 18.45 0 0 0-2.17 3.19"/></svg>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">Leave empty if the room has no password</p>
              </div>
            </div>

            {/* User Information */}
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">👤</div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Profile</h3>
                <p className="text-gray-600">Set up your anonymous identity for the room</p>
              </div>
              
              {/* Nickname */}
              <div>
                <label htmlFor="nickname" className="block text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">
                  Nickname
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    className="flex-1 px-3 sm:px-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base sm:text-lg"
                    placeholder="Choose a nickname (optional)"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, nickname: generateNickname() }))}
                    className="px-4 py-3 sm:py-4 bg-purple-100 hover:bg-purple-200 active:bg-purple-300 text-purple-700 font-semibold rounded-xl sm:rounded-2xl transition-colors duration-300 text-sm sm:text-base whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">🎲</span>
                    <span className="hidden sm:inline">Generate</span>
                    <span className="inline sm:hidden">Gen</span>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">Leave empty to auto-generate a random nickname</p>
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                  Choose Your Avatar
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3 lg:gap-4">
                  {avatarOptions.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => handleAvatarSelect(avatar)}
                      className={`w-12 h-12 sm:w-16 sm:h-16 lg:w-18 lg:h-18 text-xl sm:text-3xl lg:text-4xl rounded-xl sm:rounded-2xl border-2 sm:border-3 transition-all hover:scale-110 active:scale-95 ${
                        formData.avatar === avatar
                          ? 'border-purple-500 bg-purple-100 scale-110 shadow-lg'
                          : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3">Click to select your avatar</p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <AppIcon name="lock" size="lg" className="text-purple-500" />
                <div className="text-gray-800">
                  <h4 className="font-semibold mb-3 text-lg">Security Notice</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-purple-500">•</span>
                      Your nickname and avatar are randomly generated for anonymity
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-500">•</span>
                      All messages are end-to-end encrypted
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-500">•</span>
                      Messages auto-delete after expiration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-500">•</span>
                      Advanced security features activate in chat rooms
                    </li>
                  </ul>
                </div>
              </div>
            </div>

                         {/* Message Security Info */}
             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
               <div className="flex items-start gap-4">
                 <AppIcon name="timer-reset" size="lg" className="text-blue-500" />
                 <div className="text-gray-800">
                   <h4 className="font-semibold mb-3 text-lg">Message Security Features</h4>
                   <ul className="space-y-2 text-sm">
                     <li className="flex items-center gap-2">
                       <span className="text-blue-500">•</span>
                       <strong>All messages expire after exactly 10 minutes</strong> for enhanced security
                     </li>
                     <li className="flex items-center gap-2">
                       <span className="text-blue-500">•</span>
                       Messages automatically self-destruct to protect your privacy
                     </li>
                     <li className="flex items-center gap-2">
                       <span className="text-blue-500">•</span>
                       Room IDs are case-sensitive and must be exactly 8 characters
                     </li>
                     <li className="flex items-center gap-2">
                       <span className="text-blue-500">•</span>
                       Rooms are unlimited and never expire
                     </li>
                   </ul>
                 </div>
               </div>
             </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6"
              >
                <ul className="text-red-700 text-lg space-y-2">
                  {errors.map((error, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <AppIcon name="alert-triangle" size="md" className="text-red-600" />
                      {error}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-4 sm:py-5 px-8 rounded-2xl text-lg sm:text-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Joining Room...
                  </>
                ) : (
                  <>
                    <AppIcon name="target" size="lg" className="text-white" />
                    Join Secure Room
                  </>
                )}
              </button>
              
              <Link href="/" className="flex-1 sm:flex-none">
                <button
                  type="button"
                  className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 sm:py-5 px-8 rounded-2xl text-lg sm:text-xl border border-gray-200 transition-all duration-300"
                >
                  Cancel
                </button>
              </Link>
            </div>
          </form>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100">
            <p className="text-gray-600 text-lg mb-6">Don&apos;t have a room to join?</p>
            <Link href="/create-room">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <AppIcon name="zap" size="sm" className="text-white" /> Create New Room
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Security Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
            <div className="mb-4">
              <AppIcon name="shield-check" size="xl" className="text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Security Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600">
              <p className="flex items-center gap-2">
                <AppIcon name="shield-check" size="sm" className="text-blue-600" />
                This room uses military-grade encryption for your privacy
              </p>
              <p className="flex items-center gap-2">
                <AppIcon name="timer-reset" size="sm" className="text-blue-600" />
                Messages will automatically self-destruct for security
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <JoinRoomContent />
    </Suspense>
  );
}
