'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCodeGenerator from '@/components/QRCodeGenerator';

interface RoomData {
  id: string;
  name: string;
  password: string;
  isPrivate: boolean;
  maxUsers: number;
  messageExpiration: number;

  invisibleMode: boolean;
  creatorId?: string;
  creatorNickname?: string;
  createdAt: string;
  expiresAt?: string;
}

function RoomCreatedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get room data from localStorage (set during room creation)
    const roomId = searchParams?.get('roomId');
    if (roomId) {
      const savedRoomData = localStorage.getItem(`createdRoom_${roomId}`);
      if (savedRoomData) {
        setRoomData(JSON.parse(savedRoomData));
      } else {
        // Redirect if no room data
        router.push('/create-room');
      }
    } else {
      router.push('/create-room');
    }
  }, [searchParams, router]);

  const copyRoomLink = async () => {
    if (roomData) {
      const roomUrl = `${window.location.origin}/join-room?roomId=${roomData.id}`;
      try {
        // Check if clipboard API is available
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(roomUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          // Fallback method for older browsers or when clipboard API is not available
          const textArea = document.createElement('textarea');
          textArea.value = roomUrl;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (fallbackError) {
            console.error('Fallback copy failed:', fallbackError);
            // Show user a manual copy prompt
            alert(`Please copy this link manually: ${roomUrl}`);
          } finally {
            document.body.removeChild(textArea);
          }
        }
      } catch (error) {
        console.error('Failed to copy:', error);
        // Show user a manual copy prompt as last resort
        alert(`Please copy this link manually: ${roomUrl}`);
      }
    }
  };

  const enterRoom = () => {
    if (roomData) {
      // Save room data to localStorage for chat room
      const roomDataForChat = {
        roomId: roomData.id,
        roomName: roomData.name,
        password: roomData.password,
        maxUsers: roomData.maxUsers,
        isPrivate: roomData.isPrivate,
        messageExpiration: roomData.messageExpiration,

        invisibleMode: roomData.invisibleMode,
        creatorId: roomData.creatorId,
        creatorNickname: roomData.creatorNickname,
        createdAt: roomData.createdAt,
        expiresAt: roomData.expiresAt
      };
      
      localStorage.setItem(`createdRoom_${roomData.id}`, JSON.stringify(roomDataForChat));
      
      // Save user data for chat room (room creator)
      const userData = {
        userId: roomData.creatorId || `user_${Math.random().toString(36).substr(2, 9)}`,
        nickname: roomData.creatorNickname || `Creator_${Math.random().toString(36).substr(2, 6)}`,
        avatar: '👑', // Creator gets crown avatar
        isRoomCreator: true
      };
      
      localStorage.setItem(`chatRoom_${roomData.id}`, JSON.stringify(userData));
      
      // Navigate to chat room
      router.push(`/chat/${roomData.id}`);
    }
  };

  if (!roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto pt-20 p-6 relative z-10">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Room Created Successfully!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your secure chat room &quot;{roomData.name}&quot; is ready. Share it with others or enter now!
          </p>
        </motion.div>

        {/* Room Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50 p-8 shadow-2xl mb-8"
        >
          {/* Room Status Info */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">🎉 Room Created Successfully!</h3>
              <p className="text-green-700 mb-3">
                <strong>This room is unlimited and will not expire!</strong>
              </p>
              <p className="text-green-600 text-sm">
                Users can join at any time with the correct room ID and password. 
                Share the room details with your participants whenever you&apos;re ready.
              </p>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🏠</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Room Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="text-sm text-gray-600 mb-2">Room Name</div>
              <div className="font-semibold text-gray-900">{roomData.name}</div>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="text-sm text-gray-600 mb-2">Room ID</div>
              <div className="font-mono text-base font-bold text-gray-900 bg-white p-3 rounded-xl border-2 border-gray-300 break-all tracking-wider">
                {roomData.id}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="text-sm text-gray-600 mb-2">Max Users</div>
              <div className="font-semibold text-gray-900">{roomData.maxUsers}</div>
            </div>

                         <div className="bg-gray-50 rounded-2xl p-4">
               <div className="text-sm text-gray-600 mb-2">Message Expiration</div>
               <div className="font-semibold text-gray-900">10 minutes (Fixed)</div>
             </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="text-sm text-gray-600 mb-2">Room Status</div>
              <div className="font-semibold text-green-600">✅ Unlimited (No Expiry)</div>
            </div>
          </div>

          {/* Security Features Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">🛡️ Security Features Enabled</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <div className="flex items-center gap-2">
                <span className={`text-xl ${roomData.invisibleMode ? 'text-green-600' : 'text-gray-400'}`}>
                  {roomData.invisibleMode ? '✅' : '❌'}
                </span>
                <span className="text-sm text-gray-700">Invisible Mode</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <button
            onClick={() => setShowQRCode(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🔗</span>
            Share Room (QR Code)
          </button>

          <button
            onClick={copyRoomLink}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
          >
            {copied ? (
              <>
                <span className="text-2xl">✅</span>
                Link Copied!
              </>
            ) : (
              <>
                <span className="text-2xl">📋</span>
                Copy Link
              </>
            )}
          </button>

          <button
            onClick={enterRoom}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🚀</span>
            Enter Room Now
          </button>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-room">
                <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors duration-300">
                  🏠 Create Another Room
                </button>
              </Link>
              <Link href="/">
                <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors duration-300">
                  🏠 Back to Home
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <QRCodeGenerator
          roomId={roomData.id}
          roomName={roomData.name}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
}

export default function RoomCreatedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RoomCreatedContent />
    </Suspense>
  );
}
