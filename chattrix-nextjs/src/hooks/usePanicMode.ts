'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PanicModeState {
  isEnabled: boolean;
  isActive: boolean;
  dataCleared: boolean;
  emergencyExit: boolean;
  timestamp: Date | null;
}

export function usePanicMode(roomId?: string, userId?: string) {
  const router = useRouter();
  const [panicMode, setPanicMode] = useState<PanicModeState>({
    isEnabled: false,
    isActive: false,
    dataCleared: false,
    emergencyExit: false,
    timestamp: null,
  });

  // Check if room is in panic mode from backend
  const checkRoomPanicStatus = useCallback(async () => {
    if (!roomId) return false;
    
    try {
      const response = await fetch('/api/rooms/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId }),
      });

      const data = await response.json();
      
      if (data.exists && data.room) {
        // Check if room is in panic mode or inactive
        if (data.room.panicMode || !data.room.isActive) {
          console.log('🚨 Room is in panic mode or inactive, redirecting to landing page');
          
          // Clear room-specific data
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`chatRoom_${roomId}`);
            localStorage.removeItem(`createdRoom_${roomId}`);
          }
          
          // Redirect to landing page
          router.push('/');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking room panic status:', error);
      return false;
    }
  }, [roomId, router]);

  // Monitor room status for panic mode changes
  useEffect(() => {
    if (!roomId) return;

    // Check immediately on mount
    checkRoomPanicStatus();

    // Set up interval to check room status every 5 seconds
    const interval = setInterval(() => {
      checkRoomPanicStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [roomId, checkRoomPanicStatus]);

  // Clear all sensitive data
  const clearAllData = useCallback(() => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }

    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Clear form inputs
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
        if (input.type !== 'submit' && input.type !== 'button') {
          input.value = '';
        }
      }
    });

    // Clear chat messages
    const chatMessages = document.querySelectorAll('.chat-message, .secure-content');
    chatMessages.forEach((message) => {
      message.innerHTML = '🚫 Message cleared for security';
      message.classList.add('cleared');
    });

    setPanicMode(prev => ({
      ...prev,
      dataCleared: true,
    }));
  }, []);

  // Emergency exit - close tab/window
  const emergencyExit = useCallback(() => {
    setPanicMode(prev => ({
      ...prev,
      emergencyExit: true,
    }));

    // Clear all data first
    clearAllData();
    
    // Close the tab/window
    if (typeof window !== 'undefined') {
      window.close();
      
      // Fallback: redirect to blank page
      setTimeout(() => {
        window.location.href = 'about:blank';
      }, 100);
    }
  }, [clearAllData]);

  // Deactivate panic mode
  const deactivatePanicMode = useCallback(() => {
    setPanicMode({
      isEnabled: false,
      isActive: false,
      dataCleared: false,
      emergencyExit: false,
      timestamp: null,
    });

    // Remove overlay if exists
    const overlay = document.getElementById('panic-overlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }, []);

  // Show panic mode overlay
  const showPanicOverlay = useCallback(() => {
    if (typeof window !== 'undefined') {
      const overlay = document.createElement('div');
      overlay.id = 'panic-overlay';
      overlay.className = 'fixed inset-0 bg-red-900 z-[9999] flex items-center justify-center';
      overlay.innerHTML = `
        <div class="text-center text-white p-8">
          <div class="text-6xl mb-4">🚨</div>
          <h1 class="text-4xl font-bold mb-4">PANIC MODE ACTIVATED</h1>
          <p class="text-xl mb-6">All sensitive data has been cleared</p>
          <div class="space-y-4">
            <button id="exit-btn" class="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold text-lg">
              🚪 Emergency Exit
            </button>
            <button id="deactivate-btn" class="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-bold text-lg ml-4">
              🔓 Deactivate Panic Mode
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      // Add event listeners
      const exitBtn = overlay.querySelector('#exit-btn');
      const deactivateBtn = overlay.querySelector('#deactivate-btn');

      exitBtn?.addEventListener('click', emergencyExit);
      deactivateBtn?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        deactivatePanicMode();
      });
    }
  }, [emergencyExit, deactivatePanicMode]);

  // Activate panic mode
  const activatePanicMode = useCallback(async () => {
    if (!roomId || !userId) {
      console.error('Room ID and User ID are required for panic mode');
      return;
    }

    setPanicMode(prev => ({
      ...prev,
      isEnabled: true,
      isActive: true,
      timestamp: new Date(),
    }));

    try {
      // Call backend API to deactivate room
      const response = await fetch('/api/rooms/panic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId, userId }),
      });

      if (response.ok) {
        console.log('Panic mode activated successfully');
      } else {
        console.error('Failed to activate panic mode on backend');
      }
    } catch (error) {
      console.error('Error activating panic mode:', error);
    }

    // Clear all data immediately
    clearAllData();

    // Show panic overlay
    showPanicOverlay();

    // Redirect to landing page after delay
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        // Clear specific room data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('chatRoom_') || key.startsWith('createdRoom_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Redirect to landing page
        router.push('/');
      }
    }, 2000);
  }, [roomId, userId, clearAllData, showPanicOverlay, router]);

  // Auto-enable panic mode on page load
  useEffect(() => {
    if (panicMode.isEnabled) {
      // Auto-enable panic mode after 5 seconds of inactivity
      const timer = setTimeout(() => {
        if (panicMode.isEnabled && !panicMode.isActive) {
          activatePanicMode();
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [panicMode.isEnabled, panicMode.isActive, activatePanicMode]);

  return {
    ...panicMode,
    activatePanicMode,
    deactivatePanicMode,
    emergencyExit,
    clearAllData,
    checkRoomPanicStatus,
  };
}
