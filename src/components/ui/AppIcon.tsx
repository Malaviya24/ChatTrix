import React from 'react';
import { ShieldCheck, TimerReset, ScanSearch, Ghost, Zap, Heart, Brain, MessageCircle, Smartphone, Monitor, Globe, Lock, Eye, AlertTriangle, Users, Settings, Link, Trash2, X, Target, Crown, Info, ShieldX, FileText, Timer, ArrowUp, type LucideIcon } from 'lucide-react';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  // Security features
  'shield-check': ShieldCheck,
  'timer-reset': TimerReset,
  'scan-search': ScanSearch,
  'ghost': Ghost,
  
  // Benefits
  'zap': Zap,
  'heart': Heart,
  'brain': Brain,
  'message-circle': MessageCircle,
  
  // Platforms
  'smartphone': Smartphone,
  'monitor': Monitor,
  'globe': Globe,
  
  // General
  'lock': Lock,
  'eye': Eye,
  'alert-triangle': AlertTriangle,
  'users': Users,
  'settings': Settings,
  'link': Link,
  'trash-2': Trash2,
  'x': X,
  'target': Target,
  'crown': Crown,
  'info': Info,
  'shield-x': ShieldX,
  'file-text': FileText,
  'timer': Timer,
  'arrow-up': ArrowUp
};

// Size mapping
const sizeMap = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-9 h-9',
  xl: 'w-12 h-12'
};

interface AppIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function AppIcon({ name, size = 'xl', className = '' }: AppIconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  return (
    <IconComponent 
      className={`${sizeMap[size]} ${className}`}
      aria-hidden="true"
    />
  );
}
