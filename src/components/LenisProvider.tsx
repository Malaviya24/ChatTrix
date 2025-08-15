'use client';

import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { setGlobalLenis } from '@/hooks/useLenis';

// Define Lenis interface for type safety
interface LenisInstance {
  scrollTo: (target: string | HTMLElement | number, options?: { offset?: number; duration?: number; easing?: (t: number) => number }) => void;
  on: (event: 'scroll' | 'virtual-scroll' | string, callback: (data?: unknown) => void) => void;
  off: (event: 'scroll' | 'virtual-scroll' | string, callback: (data?: unknown) => void) => void;
  destroy: () => void;
  scroll: number;
  raf: (time: number) => void;
}

interface LenisProviderProps {
  children: React.ReactNode;
}

export default function LenisProvider({ children }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for the page to be fully rendered before initializing Lenis
    const initializeLenis = () => {
      // Small delay to ensure DOM is fully ready
      setTimeout(() => {
        if (lenisRef.current) return; // Already initialized
        
        // Initialize Lenis with optimized settings to prevent blinking
        lenisRef.current = new Lenis({
          duration: 1.0, // Slightly faster for better responsiveness
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth easing function
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 0.8, // Reduce sensitivity to prevent jarring movements
          infinite: false,
          // Optimized settings to reduce conflicts with animations
          lerp: 0.08, // Smoother interpolation
          syncTouch: false, // Disable to prevent touch conflicts
          touchMultiplier: 1.5, // Reduced touch sensitivity
        });

        // RAF loop for smooth animation
        let rafId: number;
        function raf(time: number) {
          lenisRef.current?.raf(time);
          rafId = requestAnimationFrame(raf);
        }

        rafId = requestAnimationFrame(raf);
        
        // Store rafId in ref for cleanup
        rafIdRef.current = rafId;

        // Add custom scroll event for chat-specific features
        lenisRef.current.on('scroll', () => {
          // You can add custom scroll logic here
          // For example, auto-hide/show elements based on scroll position
        });

        // Set global Lenis instance for hooks to use
        setGlobalLenis(lenisRef.current as unknown as LenisInstance);
        
        // Mark as ready
        setIsReady(true);
      }, 100); // Small delay to prevent flickering
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeLenis);
    } else {
      initializeLenis();
    }

    // Cleanup function
    return () => {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      document.removeEventListener('DOMContentLoaded', initializeLenis);
    };
  }, []);

  return (
    <div className={isReady ? 'lenis-ready' : 'lenis-loading'}>
      {children}
    </div>
  );
}
