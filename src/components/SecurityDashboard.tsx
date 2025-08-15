'use client';
import { useState, useEffect } from 'react';
import AppIcon from '@/components/ui/AppIcon';
import { useSmoothScroll, useScrollTrigger } from '@/hooks/useLenis';

interface SecurityStats {
  totalLogs: number;
  blockedIPs: number;
  activeRateLimits: number;
  recentActivity: Array<{
    roomId: string;
    action: string;
    ip: string;
    timestamp: string;
    success: boolean;
    reason?: string;
  }>;
  roomCreationStats: {
    totalRooms: number;
    roomsLastHour: number;
    uniqueIPs: number;
  };
}

export default function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize smooth scrolling
  const { scrollToTop } = useSmoothScroll();
  
  // Initialize scroll triggers
  useScrollTrigger(0.1);

  useEffect(() => {
    fetch('/api/security/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data.stats);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading security stats...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <p className="text-red-600">Failed to load security stats</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 max-w-7xl mx-auto">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center sm:text-left" data-scroll-trigger>
        Security Dashboard
      </h2>
      
      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8" data-scroll-trigger>
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 lg:p-6 border border-blue-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <AppIcon name="file-text" size="sm" className="text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-blue-600">Total Logs</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900 truncate">{stats.totalLogs}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3 sm:p-4 lg:p-6 border border-green-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <AppIcon name="users" size="sm" className="text-green-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-green-600">Total Rooms Created</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900 truncate">{stats.roomCreationStats.totalRooms}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3 sm:p-4 lg:p-6 border border-purple-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <AppIcon name="globe" size="sm" className="text-purple-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-purple-600">Unique IPs</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900 truncate">{stats.roomCreationStats.uniqueIPs}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-3 sm:p-4 lg:p-6 border border-red-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <AppIcon name="shield-x" size="sm" className="text-red-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-red-600">Blocked IPs</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-900 truncate">{stats.blockedIPs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Room Creation Stats - Responsive */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 text-center sm:text-left">
          Room Creation Statistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-gray-600">Rooms Created (Last Hour)</span>
              <span className="text-sm sm:text-lg font-bold text-gray-900">{stats.roomCreationStats.roomsLastHour}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-gray-600">Unlimited Creation</span>
              <span className="text-sm sm:text-lg font-bold text-green-600">✅ Enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Blocked IPs Management - Responsive */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 text-center sm:text-left">
          Security Management
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm font-medium text-red-600">Blocked IPs</span>
              <span className="text-sm sm:text-lg font-bold text-red-900">{stats.blockedIPs}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/security/stats', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'clearAll' })
                    });
                    if (response.ok) {
                      // Refresh the stats
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error('Failed to clear blocked IPs:', error);
                  }
                }}
                className="px-2 sm:px-3 py-1 sm:py-2 bg-red-600 text-white text-xs sm:text-sm rounded hover:bg-red-700 transition-colors"
              >
                Clear All Blocks
              </button>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-yellow-600">Active Rate Limits</span>
              <span className="text-sm sm:text-lg font-bold text-yellow-900">{stats.activeRateLimits}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Responsive */}
      <div>
        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 text-center sm:text-left">
          Recent Activity
        </h3>
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 overflow-x-auto">
          <div className="min-w-full">
            {stats.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-gray-200 last:border-b-0 gap-2 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-xs sm:text-sm font-medium capitalize">{activity.action}</span>
                  <span className="text-xs sm:text-sm font-mono text-gray-600 truncate">{activity.roomId}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  activity.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                } self-start sm:self-auto`}>
                  {activity.success ? 'Success' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={() => scrollToTop({ duration: 1.2 })}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-30 transition-all duration-300 hover:scale-110"
        title="Scroll to top"
      >
        <AppIcon name="arrow-up" size="sm" className="text-white" />
      </button>
    </div>
  );
}
