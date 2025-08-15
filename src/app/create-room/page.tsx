'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppIcon from '@/components/ui/AppIcon';

export default function CreateRoomPage() {
  const router = useRouter();
  // State for UI
  const [formData, setFormData] = useState({
    roomName: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    avatar: 'default',
    maxParticipants: 10,
    invisibleMode: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : name === 'maxParticipants' 
          ? parseInt(value, 10) 
          : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    // Validation
    const newErrors: string[] = [];
    if (formData.password.length < 6) newErrors.push('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) newErrors.push('Passwords do not match');
    if (formData.maxParticipants < 2 || formData.maxParticipants > 50) newErrors.push('Max participants must be between 2 and 50');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Generate a random room name
      const roomName = `Chat Room ${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Generate user ID and nickname for room creator
      const creatorId = `user_${Math.random().toString(36).substr(2, 9)}`;
      const creatorNickname = `Creator_${Math.random().toString(36).substr(2, 6)}`;
      
      // Call the API to create room
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          roomName,
          creatorId,
          creatorNickname
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Save room data to localStorage for the success page (without password)
        const roomData = {
          id: data.room.id,
          name: roomName,
          maxUsers: formData.maxParticipants,
          isPrivate: true, // Assuming private by default for new rooms
          messageExpiration: 10, // Default for new rooms
          panicMode: false, // Removed panic mode
          invisibleMode: formData.invisibleMode,
        };
        localStorage.setItem(`createdRoom_${data.room.id}`, JSON.stringify(roomData));
        
        // Temporarily store password in sessionStorage for next page
        sessionStorage.setItem(`tempPassword_${data.room.id}`, formData.password);
        
        // Generate a random user ID and avatar for the creator
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const avatar = ['🦊', '🐱', '🐶', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🦄'][Math.floor(Math.random() * 10)];
        
        // Save user data to localStorage for chat room access
        const userData = {
          userId,
          nickname: 'Room Creator',
          avatar,
          isRoomCreator: true // Room creator has creator privileges
        };
        localStorage.setItem(`chatRoom_${data.room.id}`, JSON.stringify(userData));
        
        // Redirect to room created success page
        router.push(`/room-created?roomId=${data.room.id}`);
      } else {
        const errorData = await response.json();
        setErrors([errorData.error || 'Failed to create room']);
      }
    } catch {
      setErrors(['Network error. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
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
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Create Your Secure Sanctuary
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
            Set up a private, encrypted chat room with advanced security features designed for your peace of mind
          </p>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/50 p-4 sm:p-6 lg:p-8 xl:p-10 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Room Basic Settings */}
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Room Settings</h3>
                <p className="text-gray-600">Configure your secure chat environment</p>
              </div>
              
              {/* Room Name Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="text-center">
                  <div className="text-3xl mb-3">🎲</div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Room Name</h4>
                  <p className="text-gray-600">A unique name will be automatically generated for your room</p>
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-lg font-semibold text-gray-800 mb-3">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-4 bg-gray-50 border rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg pr-10 ${
                        showPassword ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      }`}
                      placeholder="Min 6 characters"
                      required
                    />
                    <span
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-gray-700 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-blue-500"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-500"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.45 18.45 0 0 1-2.17 3.18m-2.83 1.82A3 3 0 0 0 12 19" />
                        </svg>
                      )}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-lg font-semibold text-gray-800 mb-3">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-4 bg-gray-50 border rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg pr-10 ${
                        showConfirmPassword ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      }`}
                      placeholder="Confirm password"
                      required
                    />
                    <span
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-gray-700 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-blue-500"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-500"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.45 18.45 0 0 1-2.17 3.18m-2.83 1.82A3 3 0 0 0 12 19" />
                        </svg>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Max Users */}
              <div>
                <label htmlFor="maxParticipants" className="block text-lg font-semibold text-gray-800 mb-3">
                  Maximum Users
                </label>
                <select
                  id="maxParticipants"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                >
                  {[2, 5, 10, 15, 20, 25, 30, 40, 50].map(num => (
                    <option key={num} value={num} className="bg-white text-gray-900">
                      {num} users
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Security Settings */}
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">
                  <AppIcon name="shield-check" size="xl" className="text-blue-600" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Security Features</h3>
                <p className="text-gray-600">Choose the protection level for your conversations</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Message Expiration - Fixed at 10 minutes */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="mb-3">
                    <AppIcon name="timer-reset" size="lg" className="text-blue-600" />
                  </div>
                  <div className="text-lg font-semibold text-gray-800 mb-3">
                    Message Expiration
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    All messages automatically expire after exactly 10 minutes for security
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                    Fixed at 10 minutes
                  </div>
                </div>



                {/* Invisible Mode */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
                  <div className="mb-3">
                    <AppIcon name="ghost" size="lg" className="text-purple-600" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="invisibleMode"
                      name="invisibleMode"
                      checked={formData.invisibleMode}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 bg-white border-purple-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="invisibleMode" className="text-lg font-semibold text-gray-800">
                      Invisible Mode
                    </label>
                  </div>
                </div>

                {/* Private Room */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
                  <div className="mb-3">
                    <AppIcon name="lock" size="lg" className="text-yellow-600" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      name="isPrivate"
                      checked={true} // Private by default
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 bg-white border-yellow-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="isPrivate" className="text-lg font-semibold text-gray-800">
                      Private Room
                    </label>
                  </div>
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
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-4 sm:py-5 px-8 rounded-2xl text-lg sm:text-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Creating Your Sanctuary...
                  </>
                ) : (
                  <>
                    <AppIcon name="zap" size="lg" className="text-white" />
                    Create Secure Room
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

        {/* Security Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-100">
            <div className="mb-4">
              <AppIcon name="brain" size="xl" className="text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Security Tips</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600">
              <p className="flex items-center gap-2">
                <AppIcon name="lock" size="sm" className="text-blue-600" />
                Your room will be encrypted with AES-256-GCM encryption
              </p>
              <p className="flex items-center gap-2">
                <AppIcon name="shield-check" size="sm" className="text-blue-600" />
                All messages are protected and will auto-delete after expiration
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
