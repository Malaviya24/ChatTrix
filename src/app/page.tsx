'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';
import { useSmoothScroll, useScrollTrigger } from '@/hooks/useLenis';

export default function ChattrixHomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);
  
  // Initialize smooth scrolling
  const { scrollToTop } = useSmoothScroll();
  
  // Initialize scroll triggers for hero section
  const { elementRef: heroRef } = useScrollTrigger(0.1);

  const features = [
    {
      icon: 'shield-check',
      title: 'End-to-End Encryption',
      description: 'Your messages are encrypted and secure from prying eyes'
    },
    {
      icon: 'timer-reset',
      title: 'Self-Destructing Messages',
      description: 'Messages automatically disappear after a set time'
    },
    {
      icon: 'ghost',
      title: 'Invisible Mode',
      description: 'Chat anonymously without revealing your identity'
    },
    {
      icon: 'users',
      title: 'Room Management',
      description: 'Create private rooms with admin controls and user management'
    },
    {
      icon: 'smartphone',
      title: 'Mobile Responsive',
      description: 'Perfect experience across all devices and screen sizes'
    },
    {
      icon: 'zap',
      title: 'Instant Access',
      description: 'No registration required - create and join rooms immediately'
    }
  ];

  const benefits = [
    'No registration required',
    'Instant room creation',
    'Real-time messaging',
    'Mobile responsive',
    'Privacy focused',
    'Easy to use'
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Set page as ready after a short delay to prevent flickering
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 100);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Show loading spinner while page is not ready
  if (!isPageReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading Chattrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg sm:text-xl font-bold">C</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-slate-800">Chattrix</span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/create-room">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 sm:px-6 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-md"
                >
                  Create Room
                </motion.button>
              </Link>
              <Link href="/join-room">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 sm:px-6 py-2 bg-white/80 text-slate-700 text-xs sm:text-sm font-medium rounded-full hover:bg-white transition-colors duration-300 backdrop-blur-sm border border-slate-200"
                >
                  Join Room
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="container mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-800 mb-4 sm:mb-6"
          >
            Secure Chat
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Made Simple
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg lg:text-xl text-slate-600 mb-8 sm:mb-12 max-w-3xl mx-auto px-4"
          >
            Experience the future of secure communication with Chattrix. 
            Create private chat rooms instantly, no registration required.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4"
          >
            <Link href="/create-room">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base sm:text-lg font-semibold rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl"
              >
                Start Chatting Now
              </motion.button>
            </Link>
            <Link href="/join-room">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/80 text-slate-700 text-base sm:text-lg font-semibold rounded-full hover:bg-white transition-all duration-300 backdrop-blur-sm border border-slate-200 shadow-lg"
              >
                Join Existing Room
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">Why Choose Chattrix?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto px-4">
              Built with privacy and security in mind, Chattrix offers enterprise-grade protection 
              without the complexity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                className="text-center group"
              >
                <div className="flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <AppIcon name={feature.icon} size="lg" className="text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white/60">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">Simple & Effective</h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto px-4">
              Get started in seconds with our streamlined approach to secure communication.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.5 }}
                className="flex items-center space-x-3 p-4 rounded-lg bg-white/80 hover:bg-white transition-colors duration-300 shadow-sm border border-slate-100"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-700">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-4xl font-bold text-slate-800 mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust Chattrix for their secure communication needs.
            </p>
            <Link href="/create-room">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xl font-semibold rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl"
              >
                Create Your First Room
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2 }}
        onClick={() => scrollToTop({ duration: 1.5 })}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-xl z-30 transition-all duration-300 hover:scale-110"
        title="Scroll to top"
      >
        <AppIcon name="arrow-up" size="lg" className="text-white" />
      </motion.button>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-white/80">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span className="text-xl font-bold text-slate-800">Chattrix</span>
          </div>
          <p className="text-slate-600">
            © 2024 Chattrix. Secure communication for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
}
