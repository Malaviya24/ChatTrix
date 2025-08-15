'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import Image from 'next/image';

interface QRCodeGeneratorProps {
  roomId: string;
  roomName?: string;
  onClose?: () => void;
}

export default function QRCodeGenerator({ roomId, roomName, onClose }: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  const roomUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join-room?roomId=${roomId}`;

  // Disable body scroll when modal is open
  useEffect(() => {
    const body = document.body;
    const originalOverflow = body.style.overflow;
    
    // Disable body scroll
    body.style.overflow = 'hidden';
    
    return () => {
      // Restore original overflow when modal closes
      body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setIsGenerating(true);
        const qrDataUrl = await QRCode.toDataURL(roomUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#1F2937',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateQRCode();
  }, [roomUrl]);

  const copyToClipboard = async () => {
    try {
      // Check if clipboard API is available
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
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
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
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
  };

  const downloadQRCode = () => {
    try {
      if (qrCodeDataUrl) {
        const link = document.createElement('a');
        link.download = `chattrix-room-${roomId}.png`;
        link.href = qrCodeDataUrl;
        
        // Append to body, click, and remove (better browser compatibility)
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error('QR Code not generated yet');
        alert('QR Code is still generating. Please wait a moment and try again.');
      }
    } catch (error) {
      console.error('Failed to download QR Code:', error);
      alert('Failed to download QR Code. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 max-w-sm sm:max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain relative"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          scrollBehavior: 'auto',
          WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors z-10"
          aria-label="Close modal"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🔗</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {roomName ? `Share "${roomName}"` : 'Share Room'}
          </h2>
          <p className="text-gray-600 text-sm">Scan the QR code or copy the link to invite others</p>
        </div>

        {/* QR Code */}
        <div className="text-center mb-4 sm:mb-6">
          {isGenerating ? (
            <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg inline-block">
              <Image 
                src={qrCodeDataUrl} 
                alt="Room QR Code" 
                width={256}
                height={256}
                className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64"
              />
            </div>
          )}
        </div>

        {/* Room Info */}
        <div className="bg-gray-50 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="text-xs sm:text-sm text-gray-600 mb-2">Room ID:</div>
          <div className="font-mono text-sm sm:text-base font-bold text-gray-900 bg-white p-2 sm:p-3 rounded-xl border-2 border-gray-300 break-all tracking-wider">
            {roomId}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 sm:space-y-3">
          <button
            onClick={copyToClipboard}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl transition-colors duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {copySuccess ? (
              <>
                <span className="text-lg sm:text-xl">✅</span>
                Copied!
              </>
            ) : (
              <>
                <span className="text-lg sm:text-xl">📋</span>
                Copy Link
              </>
            )}
          </button>

          <button
            onClick={downloadQRCode}
            disabled={!qrCodeDataUrl}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl transition-colors duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span className="text-lg sm:text-xl">💾</span>
            Download QR Code
          </button>

          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl transition-colors duration-300 text-sm sm:text-base"
          >
            Close
          </button>
        </div>

        {/* Share Tips */}
        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
          <p>💡 Share this QR code with friends to invite them to your secure chat room!</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
