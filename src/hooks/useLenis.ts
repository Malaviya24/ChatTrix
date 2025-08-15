'use client';

import { useEffect, useRef, useState } from 'react';

// Define Lenis interface for type safety
interface LenisInstance {
  scrollTo: (target: string | HTMLElement | number, options?: { offset?: number; duration?: number; easing?: (t: number) => number }) => void;
  on: (event: 'scroll' | 'virtual-scroll' | string, callback: (data?: unknown) => void) => void;
  off: (event: 'scroll' | 'virtual-scroll' | string, callback: (data?: unknown) => void) => void;
  destroy: () => void;
  scroll: number;
  raf: (time: number) => void;
}

// Global Lenis instance reference
let globalLenis: LenisInstance | null = null;

// Function to set global Lenis instance
export const setGlobalLenis = (lenis: LenisInstance) => {
  globalLenis = lenis;
};

// Hook to get the global Lenis instance
export function useLenis() {
  const [lenis, setLenis] = useState<LenisInstance | null>(null);

  useEffect(() => {
    // Check if global Lenis is available
    if (globalLenis) {
      setLenis(globalLenis);
      return;
    }

    // Poll for global Lenis to become available
    let timerId: NodeJS.Timeout;
    let isMounted = true;
    
    const checkLenis = () => {
      if (!isMounted) return;
      
      if (globalLenis) {
        setLenis(globalLenis);
      } else {
        timerId = setTimeout(checkLenis, 50);
      }
    };

    checkLenis();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, []);

  return lenis;
}

// Hook for smooth scrolling to specific elements
export function useSmoothScroll() {
  const lenis = useLenis();

  const scrollTo = (target: string | HTMLElement | number, options?: {
    offset?: number;
    duration?: number;
    easing?: (t: number) => number;
  }) => {
    if (!lenis) return;

    if (typeof target === 'string') {
      const element = document.querySelector(target);
      if (element) {
        lenis.scrollTo(element as HTMLElement, options);
      }
    } else if (typeof target === 'number') {
      lenis.scrollTo(target, options);
    } else {
      lenis.scrollTo(target, options);
    }
  };

  const scrollToTop = (options?: { duration?: number; easing?: (t: number) => number }) => {
    if (!lenis) return;
    lenis.scrollTo(0, options);
  };

  const scrollToBottom = (options?: { duration?: number; easing?: (t: number) => number }) => {
    if (!lenis) return;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    lenis.scrollTo(scrollHeight - clientHeight, options);
  };

  return {
    lenis,
    scrollTo,
    scrollToTop,
    scrollToBottom,
  };
}

// Hook for scroll-triggered animations - Improved to prevent blinking
export function useScrollTrigger(threshold: number = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only trigger once and only when becoming visible
        if (entry.isIntersecting && !hasTriggered.current) {
          setIsVisible(true);
          element.classList.add('scroll-triggered');
          hasTriggered.current = true;
          
          // Disconnect observer after triggering to prevent re-triggering
          observer.disconnect();
        }
      },
      { 
        threshold,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element is fully visible
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return { elementRef, isVisible };
}

// Hook for parallax effects
export function useParallax(speed: number = 0.5) {
  const elementRef = useRef<HTMLElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !lenis) return;

    const handleScroll = () => {
      if (element) {
        const scrolled = lenis.scroll;
        const rate = scrolled * speed;
        element.style.transform = `translateY(${rate}px)`;
      }
    };

    lenis.on('scroll', handleScroll);

    return () => {
      lenis.off('scroll', handleScroll);
    };
  }, [lenis, speed]);

  return elementRef;
}
