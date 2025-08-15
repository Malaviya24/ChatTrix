'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import AppIcon from '@/components/ui/AppIcon';

import { useSmoothScroll, useScrollTrigger } from '@/hooks/useLenis';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
  className?: string;

}

export default function ResponsiveLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  backUrl = '/',
  className = ''
}: ResponsiveLayoutProps) {

  
  // Initialize smooth scrolling
  const { scrollToTop } = useSmoothScroll();
  
  // Initialize scroll triggers
  useScrollTrigger(0.1);
  
  // Auto-scroll to top when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Smooth scroll to top with a slight delay for better UX
      setTimeout(() => {
        scrollToTop({ duration: 1.5 });
      }, 100);
    }
  }, [scrollToTop]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black relative overflow-hidden">
      {/* Security Status Bar - Mobile Optimized */}
      <div className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-sm z-50 p-2 sm:p-3">
        <div className="flex flex-col sm:flex-row justify-between items-center text-white text-xs sm:text-sm gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center sm:justify-start">
            {showBackButton && (
              <a
                href={backUrl}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-xs font-bold transition-colors hover:scale-105 transform"
                onClick={(e) => {
                  e.preventDefault();
                  // Smooth scroll to top before navigation
                  scrollToTop({ duration: 0.8 });
                  setTimeout(() => {
                    window.location.href = backUrl;
                  }, 800);
                }}
              >
                ← Back
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className={`max-w-6xl mx-auto pt-16 sm:pt-20 p-3 sm:p-4 lg:p-6 ${className}`}>
        {/* Header - Conditional */}
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white mb-6 sm:mb-8 lg:mb-12"
            data-scroll-trigger
          >
            {title && (
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto px-4">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          data-scroll-trigger
        >
          {children}
        </motion.div>
      </div>



      {/* Mobile Navigation Hint */}
      <div className="fixed bottom-2 left-2 sm:hidden bg-black/50 backdrop-blur-sm rounded-lg p-2 text-white text-xs z-30">
        <div className="flex items-center gap-2">
          <AppIcon name="smartphone" size="sm" className="text-white" />
          <span>Swipe for more</span>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        onClick={() => scrollToTop({ duration: 1.2 })}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-30 transition-all duration-300 hover:scale-110"
        title="Scroll to top"
      >
        <AppIcon name="arrow-up" size="sm" className="text-white" />
      </motion.button>
    </div>
  );
}

// Responsive Container Component
export function ResponsiveContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-3 sm:p-4 lg:p-6 xl:p-8 ${className}`} data-scroll-trigger>
      {children}
    </div>
  );
}

// Responsive Grid Component
export function ResponsiveGrid({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'gap-3 sm:gap-4 lg:gap-6',
  className = ''
}: { 
  children: React.ReactNode; 
  cols?: { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: string;
  className?: string;
}) {
  const gridCols = [
    'grid-cols-1',
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={`grid ${gridCols} ${gap} ${className}`} data-scroll-trigger>
      {children}
    </div>
  );
}

// Responsive Button Component
export function ResponsiveButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  [key: string]: unknown;
}) {
  const baseClasses = 'font-bold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 hover:scale-105 transform';
  
  const variants = {
    primary: 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg',
    secondary: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };

  const sizes = {
    sm: 'px-3 sm:px-4 py-2 text-xs sm:text-sm',
    md: 'px-4 sm:px-6 py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg',
    lg: 'px-6 sm:px-8 py-3 sm:py-4 lg:py-5 text-base sm:text-lg lg:text-xl'
  };

  const widthClass = fullWidth ? 'w-full sm:w-auto' : '';

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Responsive Input Component
export function ResponsiveInput({
  label,
  error,
  className = '',
  ...props
}: {
  label?: string;
  error?: string;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <div className="space-y-2" data-scroll-trigger>
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base hover:border-white/30 focus:border-blue-500`}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-xs sm:text-sm">{error}</p>
      )}
    </div>
  );
}

// Responsive Card Component
export function ResponsiveCard({ 
  children, 
  className = '',
  padding = 'default'
}: { 
  children: React.ReactNode; 
  className?: string;
  padding?: 'small' | 'default' | 'large';
}) {
  const paddingClasses = {
    small: 'p-3 sm:p-4',
    default: 'p-4 sm:p-6',
    large: 'p-6 sm:p-8'
  };

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 ${paddingClasses[padding]} ${className} hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] transform`} data-scroll-trigger>
      {children}
    </div>
  );
}

// Responsive Text Component
export function ResponsiveText({ 
  children, 
  variant = 'body',
  className = ''
}: { 
  children: React.ReactNode; 
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption';
  className?: string;
}) {
  const variants = {
    h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold',
    h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold',
    h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold',
    h4: 'text-base sm:text-lg md:text-xl lg:text-2xl font-semibold',
    body: 'text-sm sm:text-base lg:text-lg',
    small: 'text-xs sm:text-sm',
    caption: 'text-xs'
  };

  return (
    <div className={`${variants[variant]} ${className}`} data-scroll-trigger>
      {children}
    </div>
  );
}
